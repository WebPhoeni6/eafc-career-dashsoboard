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

function parseJsonFromText(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || text || '').trim();

  try {
    return JSON.parse(candidate);
  } catch (_) {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
  }

  throw new AppError('AI response could not be parsed as JSON', 502, 'AI_PARSE_ERROR');
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
  const firstText = await callGeminiRaw({
    systemInstruction,
    prompt,
    responseMimeType: 'application/json',
    temperature: 0.15,
    maxOutputTokens: 2200,
  });

  try {
    const firstJson = parseJsonFromText(firstText);
    return schema.parse(firstJson);
  } catch (_) {
    const retryPrompt = [
      prompt,
      '',
      'Previous output was invalid for the required schema.',
      fixPromptSuffix,
    ].join('\n');

    const secondText = await callGeminiRaw({
      systemInstruction,
      prompt: retryPrompt,
      responseMimeType: 'application/json',
      temperature: 0,
      maxOutputTokens: 2200,
    });
    const secondJson = parseJsonFromText(secondText);
    return schema.parse(secondJson);
  }
}

module.exports = {
  callGeminiRaw,
  runJsonPrompt,
};
