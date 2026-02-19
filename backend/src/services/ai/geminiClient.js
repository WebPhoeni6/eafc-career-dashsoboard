const config = require('../../config/env');
const { AppError } = require('../../middlewares/error');

const SUPPORTED_PROVIDERS = ['openai', 'gemini'];

function normalizeModelName(model, fallback) {
  const raw = String(model || '').trim();
  const normalized = raw.replace(/^models\//i, '');
  return normalized || fallback;
}

function toUniqueList(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseProviderOrder(raw) {
  const parsed = String(raw || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => SUPPORTED_PROVIDERS.includes(item));
  if (parsed.length) return toUniqueList(parsed);
  return ['openai', 'gemini'];
}

function isProviderConfigured(provider) {
  if (provider === 'openai') return !!config.OPENAI_API_KEY;
  if (provider === 'gemini') return !!config.GEMINI_API_KEY;
  return false;
}

function buildProviderCandidates() {
  const ordered = parseProviderOrder(config.AI_PROVIDER_ORDER || 'openai,gemini');
  return ordered.filter((provider) => isProviderConfigured(provider));
}

function buildGeminiModelCandidates(modelPreference = 'quality') {
  const pref = String(modelPreference || 'quality').toLowerCase();
  const quality = normalizeModelName(config.GEMINI_MODEL, 'gemini-2.5-flash');
  const fast = normalizeModelName(config.GEMINI_FAST_MODEL || 'gemini-2.0-flash', 'gemini-2.0-flash');

  const defaultFallbacks = ['gemini-2.0-flash', 'gemini-1.5-flash'];

  if (pref === 'fast' || pref === 'balanced') {
    return toUniqueList([fast, quality, ...defaultFallbacks].map((model) => normalizeModelName(model, 'gemini-2.0-flash')));
  }

  return toUniqueList([quality, fast, ...defaultFallbacks].map((model) => normalizeModelName(model, 'gemini-2.0-flash')));
}

function buildOpenAiModelCandidates(modelPreference = 'quality') {
  const pref = String(modelPreference || 'quality').toLowerCase();
  const quality = normalizeModelName(config.OPENAI_MODEL, 'gpt-4o-mini');
  const fast = normalizeModelName(config.OPENAI_FAST_MODEL || quality, quality);
  const fallback = 'gpt-4o-mini';

  if (pref === 'fast' || pref === 'balanced') {
    return toUniqueList([fast, quality, fallback].map((model) => normalizeModelName(model, 'gpt-4o-mini')));
  }

  return toUniqueList([quality, fast, fallback].map((model) => normalizeModelName(model, 'gpt-4o-mini')));
}

function isModelFallbackEligible(status, rawText = '') {
  if ([400, 404, 408, 409, 429, 500, 502, 503, 504].includes(status)) return true;
  if (status !== 403) return false;
  return /quota|rate limit|resource exhausted|too many requests|exceeded|insufficient/i.test(String(rawText || ''));
}

function extractOutputText(payload) {
  const texts = [];

  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text.trim() : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) texts.push(text);
  }

  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    texts.push(payload.output_text.trim());
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
  if (chunks.length) texts.push(chunks.join('\n').trim());

  if (!texts.length) return '';
  return texts.sort((a, b) => b.length - a.length)[0];
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

function buildNotConfiguredError() {
  return new AppError(
    'AI analysis is not configured. Set OPENAI_API_KEY (preferred) or GEMINI_API_KEY in backend/.env',
    400,
    'AI_NOT_CONFIGURED',
  );
}

async function callGeminiRaw({
  systemInstruction,
  prompt,
  modelPreference = 'quality',
  responseMimeType = 'text/plain',
  temperature = 0.2,
  maxOutputTokens = 1800,
}) {
  if (!config.GEMINI_API_KEY) {
    throw buildNotConfiguredError();
  }
  if (typeof fetch !== 'function') {
    throw new AppError('Runtime does not support fetch for AI analysis', 500, 'AI_RUNTIME_ERROR');
  }

  const modelCandidates = buildGeminiModelCandidates(modelPreference);

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
      if (isModelFallbackEligible(response.status, rawText)) continue;

      const message = extractUpstreamError(rawText, 'Gemini request failed');
      throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
        provider: 'gemini',
        status: response.status,
        model,
        modelPreference,
        triedModels: modelCandidates,
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
      modelPreference,
      triedModels: modelCandidates,
      body: String(lastError.rawText || '').slice(0, 700),
    });
  }

  throw new AppError('Gemini request failed', 502, 'AI_UPSTREAM_ERROR');
}

async function callOpenAiRaw({
  systemInstruction,
  prompt,
  modelPreference = 'quality',
  temperature = 0.2,
  maxOutputTokens = 1800,
}) {
  if (!config.OPENAI_API_KEY) {
    throw buildNotConfiguredError();
  }
  if (typeof fetch !== 'function') {
    throw new AppError('Runtime does not support fetch for AI analysis', 500, 'AI_RUNTIME_ERROR');
  }

  const modelCandidates = buildOpenAiModelCandidates(modelPreference);
  let lastError = null;

  for (const model of modelCandidates) {
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: [
            ...(systemInstruction
              ? [{ role: 'system', content: [{ type: 'input_text', text: String(systemInstruction) }] }]
              : []),
            { role: 'user', content: [{ type: 'input_text', text: String(prompt) }] },
          ],
          temperature,
          max_output_tokens: maxOutputTokens,
        }),
      });
    } catch (err) {
      throw new AppError(
        `OpenAI request failed: ${err instanceof Error ? err.message : 'network error'}`,
        502,
        'AI_UPSTREAM_ERROR',
      );
    }

    const rawText = await response.text();
    if (!response.ok) {
      lastError = { status: response.status, model, rawText };
      if (isModelFallbackEligible(response.status, rawText)) continue;

      const message = extractUpstreamError(rawText, 'OpenAI request failed');
      throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
        provider: 'openai',
        status: response.status,
        model,
        modelPreference,
        triedModels: modelCandidates,
        body: rawText.slice(0, 700),
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch (_) {
      throw new AppError('OpenAI returned invalid JSON payload', 502, 'AI_UPSTREAM_ERROR');
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      throw new AppError('OpenAI returned empty output', 502, 'AI_EMPTY_OUTPUT');
    }

    return outputText;
  }

  if (lastError) {
    const message = extractUpstreamError(lastError.rawText, 'OpenAI request failed');
    throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
      provider: 'openai',
      status: lastError.status,
      model: lastError.model,
      modelPreference,
      triedModels: modelCandidates,
      body: String(lastError.rawText || '').slice(0, 700),
    });
  }

  throw new AppError('OpenAI request failed', 502, 'AI_UPSTREAM_ERROR');
}

function shouldTryNextProvider(err) {
  if (!(err instanceof AppError)) return false;
  return ['AI_NOT_CONFIGURED', 'AI_UPSTREAM_ERROR', 'AI_EMPTY_OUTPUT'].includes(err.code);
}

async function callProviderRaw({
  systemInstruction,
  prompt,
  modelPreference = 'quality',
  responseMimeType = 'text/plain',
  temperature = 0.2,
  maxOutputTokens = 1800,
}) {
  const providers = buildProviderCandidates();
  if (!providers.length) throw buildNotConfiguredError();

  const diagnostics = [];
  let lastErr = null;

  for (const provider of providers) {
    try {
      if (provider === 'openai') {
        return await callOpenAiRaw({
          systemInstruction,
          prompt,
          modelPreference,
          temperature,
          maxOutputTokens,
        });
      }

      return await callGeminiRaw({
        systemInstruction,
        prompt,
        modelPreference,
        responseMimeType,
        temperature,
        maxOutputTokens,
      });
    } catch (err) {
      if (!shouldTryNextProvider(err)) throw err;
      lastErr = err;
      diagnostics.push({
        provider,
        code: err.code,
        message: err.message,
        details: err.details || null,
      });
    }
  }

  if (lastErr instanceof AppError) {
    throw new AppError(
      lastErr.message,
      lastErr.statusCode,
      lastErr.code,
      {
        ...(lastErr.details && typeof lastErr.details === 'object' ? lastErr.details : {}),
        providerAttempts: diagnostics,
      },
    );
  }

  throw new AppError('All configured AI providers failed', 502, 'AI_UPSTREAM_ERROR', {
    providerAttempts: diagnostics,
  });
}

async function runJsonPrompt({
  systemInstruction,
  prompt,
  schema,
  modelPreference = 'quality',
  fixPromptSuffix = 'Fix JSON only. Return valid JSON only.',
  maxAttempts = 4,
}) {
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

  const plainTextRetryPrompt = [
    strictRetryPrompt,
    'Important: keep values concise so the full JSON completes.',
    'No commentary before or after JSON.',
  ].join('\n');

  const allAttempts = [
    { label: 'initial', prompt, temperature: 0.15, responseMimeType: 'application/json' },
    { label: 'repair', prompt: retryPrompt, temperature: 0, responseMimeType: 'application/json' },
    { label: 'strict-repair', prompt: strictRetryPrompt, temperature: 0, responseMimeType: 'application/json' },
    { label: 'text-repair', prompt: plainTextRetryPrompt, temperature: 0, responseMimeType: 'text/plain' },
  ];
  const safeMaxAttempts = Math.max(1, Math.min(allAttempts.length, Number(maxAttempts) || 1));
  const attempts = allAttempts.slice(0, safeMaxAttempts);

  const diagnostics = [];

  for (const attempt of attempts) {
    const rawText = await callProviderRaw({
      systemInstruction,
      prompt: attempt.prompt,
      modelPreference,
      responseMimeType: attempt.responseMimeType,
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
  callOpenAiRaw,
  callProviderRaw,
  runJsonPrompt,
};
