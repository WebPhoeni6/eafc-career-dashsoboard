const config = require('../../config/env');
const { AppError } = require('../../middlewares/error');

function normalizeModelName(model) {
  const raw = String(model || '').trim();
  return raw.replace(/^models\//i, '') || 'gemini-2.0-flash';
}

function extractOutputText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const parts = candidates[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text.trim() : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) return text;
  }

  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const chunks = [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }
  return chunks.join('\n').trim();
}

function previewText(text, limit = 320) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function extractBalancedJsonSnippet(text) {
  const source = String(text || '');
  const firstObject = source.indexOf('{');
  const firstArray = source.indexOf('[');
  let start = -1;
  if (firstObject >= 0 && firstArray >= 0) start = Math.min(firstObject, firstArray);
  else start = Math.max(firstObject, firstArray);
  if (start < 0) return '';

  const stack = [source[start]];
  let inString = false;
  let escaped = false;

  for (let i = start + 1; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{' || ch === '[') {
      stack.push(ch);
      continue;
    }

    if (ch === '}' || ch === ']') {
      const last = stack[stack.length - 1];
      const isMatch = (last === '{' && ch === '}') || (last === '[' && ch === ']');
      if (!isMatch) return '';

      stack.pop();
      if (!stack.length) return source.slice(start, i + 1).trim();
    }
  }

  return '';
}

function addCandidate(list, raw) {
  const value = String(raw || '').trim();
  if (!value) return;
  if (!list.includes(value)) list.push(value);
}

function escapeControlCharsInStrings(input) {
  const text = String(input || '');
  let inString = false;
  let escaped = false;
  let out = '';

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }

      if (ch === '"') {
        out += ch;
        inString = false;
        continue;
      }

      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') {
        out += '\\r';
        continue;
      }
      if (ch === '\t') {
        out += '\\t';
        continue;
      }

      out += ch;
      continue;
    }

    if (ch === '"') {
      out += ch;
      inString = true;
      continue;
    }

    out += ch;
  }

  return out;
}

function normalizeJsonLikeText(input) {
  return escapeControlCharsInStrings(
    String(input || '')
      .replace(/\u201C|\u201D/g, '"')
      .replace(/\u2018|\u2019/g, "'"),
  );
}

function tryParseJson(candidate) {
  const variants = [];
  addCandidate(variants, candidate);

  const normalized = normalizeJsonLikeText(candidate);
  addCandidate(variants, normalized);
  addCandidate(variants, normalized.replace(/,\s*([}\]])/g, '$1'));
  addCandidate(variants, String(candidate || '').replace(/,\s*([}\]])/g, '$1'));

  let lastErr = null;
  for (const variant of variants) {
    try {
      return JSON.parse(variant);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Invalid JSON');
}

function parseJsonFromText(text) {
  const source = String(text || '').replace(/^\uFEFF/, '').trim();
  const fenced = source.match(/```json\s*([\s\S]*?)```/i) || source.match(/```\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || source || '').trim().replace(/^json\s*/i, '').trim();

  const candidates = [];
  addCandidate(candidates, candidate);

  const objectStart = candidate.indexOf('{');
  const objectEnd = candidate.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    addCandidate(candidates, candidate.slice(objectStart, objectEnd + 1));
  }

  const arrayStart = candidate.indexOf('[');
  const arrayEnd = candidate.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    addCandidate(candidates, candidate.slice(arrayStart, arrayEnd + 1));
  }

  addCandidate(candidates, extractBalancedJsonSnippet(candidate));

  let lastParseError = null;
  for (const item of candidates) {
    try {
      return tryParseJson(item);
    } catch (err) {
      lastParseError = err;
      // try next candidate
    }
  }

  throw new AppError('AI response could not be parsed as JSON', 502, 'AI_PARSE_ERROR', {
    preview: previewText(source),
    parseError: lastParseError instanceof Error ? lastParseError.message : 'Invalid JSON',
    textLength: source.length,
  });
}

function summarizeSchemaIssues(error, max = 6) {
  const issues = Array.isArray(error?.issues) ? error.issues : [];
  return issues.slice(0, max).map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.join('.') : '',
    message: issue.message,
    code: issue.code,
  }));
}

function extractUpstreamError(rawText, fallbackMessage) {
  if (!rawText) return fallbackMessage;
  try {
    const parsed = JSON.parse(rawText);
    const msg = parsed?.error?.message || parsed?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  } catch (_) {
    // no-op
  }
  return rawText.slice(0, 240).trim() || fallbackMessage;
}

async function callGeminiRaw({ systemInstruction, prompt, responseMimeType = 'text/plain', temperature = 0.2, maxOutputTokens = 1800 }) {
  if (!config.GEMINI_API_KEY) {
    throw new AppError('AI analysis is not configured. Set GEMINI_API_KEY in backend/.env', 400, 'AI_NOT_CONFIGURED');
  }
  if (typeof fetch !== 'function') {
    throw new AppError('Runtime does not support fetch for AI analysis', 500, 'AI_RUNTIME_ERROR');
  }

  const modelCandidates = Array.from(
    new Set([
      normalizeModelName(config.GEMINI_MODEL),
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ]),
  );

  let lastError = null;
  for (const model of modelCandidates) {
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${encodeURIComponent(config.GEMINI_API_KEY)}`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemInstruction
            ? { parts: [{ text: String(systemInstruction) }] }
            : undefined,
          contents: [{ role: 'user', parts: [{ text: String(prompt) }] }],
          generationConfig: {
            responseMimeType,
            temperature,
            maxOutputTokens,
          },
        }),
      });
    } catch (err) {
      throw new AppError(
        `Gemini request failed: ${err instanceof Error ? err.message : 'network error'}`,
        502,
        'AI_UPSTREAM_ERROR',
      );
    }

    const rawText = await response.text();
    if (!response.ok) {
      lastError = { status: response.status, model, rawText };
      if (response.status === 404 || response.status === 400) continue;

      const message = extractUpstreamError(rawText, 'Gemini request failed');
      throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
        provider: 'gemini',
        status: response.status,
        model,
        body: rawText.slice(0, 700),
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch (_) {
      throw new AppError('Gemini returned invalid JSON payload', 502, 'AI_UPSTREAM_ERROR');
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      throw new AppError('Gemini returned empty output', 502, 'AI_EMPTY_OUTPUT');
    }
    return outputText;
  }

  if (lastError) {
    const message = extractUpstreamError(lastError.rawText, 'Gemini request failed');
    throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
      provider: 'gemini',
      status: lastError.status,
      model: lastError.model,
      body: String(lastError.rawText || '').slice(0, 700),
    });
  }

  throw new AppError('Gemini request failed', 502, 'AI_UPSTREAM_ERROR');
}

async function runJsonPrompt({ systemInstruction, prompt, schema, fixPromptSuffix = 'Fix JSON only. Return valid JSON only.' }) {
  const retryPrompt = [
    prompt,
    '',
    'Previous output was invalid for the required schema.',
    fixPromptSuffix,
  ].join('\n');

  const strictRetryPrompt = [
    retryPrompt,
    'Return only JSON.',
    'Do not include markdown code fences.',
    'Start with "{" and end with "}" (or array brackets if schema requires an array).',
  ].join('\n');

  const attempts = [
    { label: 'initial', prompt, temperature: 0.15 },
    { label: 'repair', prompt: retryPrompt, temperature: 0 },
    { label: 'strict-repair', prompt: strictRetryPrompt, temperature: 0 },
  ];

  const diagnostics = [];

  for (const attempt of attempts) {
    const rawText = await callGeminiRaw({
      systemInstruction,
      prompt: attempt.prompt,
      responseMimeType: 'application/json',
      temperature: attempt.temperature,
      maxOutputTokens: 3200,
    });

    let parsed;
    try {
      parsed = parseJsonFromText(rawText);
    } catch (err) {
      diagnostics.push({
        attempt: attempt.label,
        stage: 'parse',
        message: err instanceof Error ? err.message : 'JSON parse failed',
        details: err?.details || null,
        preview: previewText(rawText),
      });
      continue;
    }

    const validated = schema.safeParse(parsed);
    if (validated.success) return validated.data;

    diagnostics.push({
      attempt: attempt.label,
      stage: 'schema',
      message: 'JSON did not match expected schema',
      issues: summarizeSchemaIssues(validated.error),
      preview: previewText(JSON.stringify(parsed)),
    });
  }

  const hasSchemaError = diagnostics.some((item) => item.stage === 'schema');
  throw new AppError(
    hasSchemaError ? 'AI response did not match required JSON schema' : 'AI response could not be parsed as JSON',
    502,
    hasSchemaError ? 'AI_SCHEMA_ERROR' : 'AI_PARSE_ERROR',
    { attempts: diagnostics },
  );
}

module.exports = {
  callGeminiRaw,
  runJsonPrompt,
};
