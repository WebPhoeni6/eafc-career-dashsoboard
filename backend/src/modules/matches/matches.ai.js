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

function buildPrompt() {
  return [
    'Extract FC-style player match details from these screenshots.',
    'Return strict JSON only (no markdown) with this object shape:',
    '{',
    '  "suggested": { ...fields that are visible... },',
    '  "confidence": 0.0,',
    '  "missingFields": ["fieldName"],',
    '  "warnings": ["short warning"],',
    '  "summary": "short summary"',
    '}',
    'Allowed suggested fields:',
    'competition, stage, matchDate, opponent, posPlayed, scoreFor, scoreAgainst, minutesPlayed, matchRating, goals, assists, shots, shotsOnTarget, xG, keyPasses, chancesCreated, dribblesAttempted, dribblesCompleted, passAccuracy, crossAccuracy, motm, clutchMoment, objectivesCompleted, objectivesNotes, opponentStrength, ovrAfter, spAfter, trust, notes.',
    'Field value rules:',
    '- competition: Friendly|League|Cup|UCL|UEL|International|Other',
    '- stage: N/A|Group|Round of 16|Quarter-Final|Semi-Final|Final',
    '- posPlayed: GK|CB|LB|RB|CDM|CM|CAM|LW|RW|CF|ST',
    '- trust: Full|High|Medium|Low',
    '- matchDate format: YYYY-MM-DD when possible',
    '- confidence in range 0..1',
    '- If uncertain, do not guess; put field name in missingFields',
  ].join('\n');
}

function buildEafcQuickPrompt() {
  return [
    'You are an OCR extractor optimized for EAFC post-match player performance UI.',
    'Return strict JSON only (no markdown) with this exact shape:',
    '{',
    '  "suggested": {',
    '    "competition": "League|Cup|UCL|UEL|Friendly|International|Other",',
    '    "stage": "N/A|Group|Round of 16|Quarter-Final|Semi-Final|Final",',
    '    "opponent": "string",',
    '    "scoreFor": 0,',
    '    "scoreAgainst": 0,',
    '    "posPlayed": "GK|CB|LB|RB|CDM|CM|CAM|LW|RW|CF|ST",',
    '    "minutesPlayed": 90,',
    '    "matchRating": 7.5,',
    '    "goals": 0,',
    '    "assists": 0,',
    '    "shots": 0,',
    '    "shotsOnTarget": 0,',
    '    "xG": 0,',
    '    "keyPasses": 0,',
    '    "chancesCreated": 0,',
    '    "dribblesAttempted": 0,',
    '    "dribblesCompleted": 0,',
    '    "passAccuracy": 0,',
    '    "crossAccuracy": 0,',
    '    "trust": "Full|High|Medium|Low",',
    '    "motm": false',
    '  },',
    '  "confidence": 0.0,',
    '  "missingFields": ["fieldName"],',
    '  "warnings": ["short warning"],',
    '  "summary": "short summary"',
    '}',
    'Rules:',
    '- Extract only what is clearly visible in the image(s).',
    '- Prefer values from EAFC match summary and player performance blocks.',
    '- If a field is not visible, omit from suggested and include in missingFields.',
    '- confidence must be in range 0..1.',
    '- Keep summary under 120 characters.',
  ].join('\n');
}

function extractUpstreamError(rawText, fallbackMessage) {
  if (!rawText) return fallbackMessage;
  try {
    const parsed = JSON.parse(rawText);
    const msg = parsed?.error?.message || parsed?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  } catch (_) {
    // ignore parse error
  }
  return rawText.slice(0, 220).trim() || fallbackMessage;
}

function extractSuggestedFieldCount(raw) {
  if (!raw || typeof raw !== 'object') return 0;
  const suggested = raw.suggested && typeof raw.suggested === 'object' ? raw.suggested : raw;
  return suggested && typeof suggested === 'object' ? Object.keys(suggested).length : 0;
}

async function callGemini(files) {
  if (!config.GEMINI_API_KEY) return null;

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: buildPrompt() },
                ...files.map((file) => ({
                  inline_data: {
                    mime_type: file.mimetype,
                    data: file.buffer.toString('base64'),
                  },
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
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
      lastError = {
        status: response.status,
        model,
        rawText,
      };

      if (response.status === 404 || response.status === 400) {
        continue;
      }

      const message = extractUpstreamError(rawText, 'Gemini analysis request failed');
      throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
        provider: 'gemini',
        status: response.status,
        model,
        body: rawText.slice(0, 600),
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch (_) {
      throw new AppError('Gemini analysis returned invalid JSON payload', 502, 'AI_UPSTREAM_ERROR');
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      throw new AppError('Gemini analysis returned empty output', 502, 'AI_EMPTY_OUTPUT');
    }

    return parseJsonFromText(outputText);
  }

  if (lastError) {
    const message = extractUpstreamError(lastError.rawText, 'Gemini analysis request failed');
    throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
      provider: 'gemini',
      status: lastError.status,
      model: lastError.model,
      body: String(lastError.rawText || '').slice(0, 600),
    });
  }

  throw new AppError('Gemini analysis request failed', 502, 'AI_UPSTREAM_ERROR');
}

async function callGeminiQuick(files) {
  if (!config.GEMINI_API_KEY) return null;

  const modelCandidates = Array.from(
    new Set([
      normalizeModelName(config.GEMINI_FAST_MODEL || 'gemini-2.0-flash'),
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: buildEafcQuickPrompt() },
                ...files.map((file) => ({
                  inline_data: {
                    mime_type: file.mimetype,
                    data: file.buffer.toString('base64'),
                  },
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });
    } catch (err) {
      throw new AppError(
        `Gemini quick request failed: ${err instanceof Error ? err.message : 'network error'}`,
        502,
        'AI_UPSTREAM_ERROR',
      );
    }

    const rawText = await response.text();
    if (!response.ok) {
      lastError = {
        status: response.status,
        model,
        rawText,
      };

      if (response.status === 404 || response.status === 400) {
        continue;
      }

      const message = extractUpstreamError(rawText, 'Gemini quick analysis request failed');
      throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
        provider: 'gemini',
        status: response.status,
        model,
        body: rawText.slice(0, 600),
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch (_) {
      throw new AppError('Gemini quick analysis returned invalid JSON payload', 502, 'AI_UPSTREAM_ERROR');
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      throw new AppError('Gemini quick analysis returned empty output', 502, 'AI_EMPTY_OUTPUT');
    }

    const parsed = parseJsonFromText(outputText);
    return {
      ...parsed,
      _pipeline: 'EAFC_QUICK',
      _suggestedFieldCount: extractSuggestedFieldCount(parsed),
    };
  }

  if (lastError) {
    const message = extractUpstreamError(lastError.rawText, 'Gemini quick analysis request failed');
    throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
      provider: 'gemini',
      status: lastError.status,
      model: lastError.model,
      body: String(lastError.rawText || '').slice(0, 600),
    });
  }

  throw new AppError('Gemini quick analysis request failed', 502, 'AI_UPSTREAM_ERROR');
}

async function callOpenAI(files) {
  if (!config.OPENAI_API_KEY) return null;

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.OPENAI_MODEL,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildPrompt() },
              ...files.map((file) => ({
                type: 'input_image',
                image_url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
              })),
            ],
          },
        ],
        max_output_tokens: 1200,
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
    const message = extractUpstreamError(rawText, 'OpenAI analysis request failed');
    throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
      provider: 'openai',
      status: response.status,
      model: config.OPENAI_MODEL,
      body: rawText.slice(0, 600),
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (_) {
    throw new AppError('OpenAI analysis returned invalid JSON payload', 502, 'AI_UPSTREAM_ERROR');
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new AppError('OpenAI analysis returned empty output', 502, 'AI_EMPTY_OUTPUT');
  }

  return parseJsonFromText(outputText);
}

async function callOpenAIQuick(files) {
  if (!config.OPENAI_API_KEY) return null;

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.OPENAI_FAST_MODEL || config.OPENAI_MODEL,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildEafcQuickPrompt() },
              ...files.map((file) => ({
                type: 'input_image',
                image_url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
              })),
            ],
          },
        ],
        max_output_tokens: 700,
      }),
    });
  } catch (err) {
    throw new AppError(
      `OpenAI quick request failed: ${err instanceof Error ? err.message : 'network error'}`,
      502,
      'AI_UPSTREAM_ERROR',
    );
  }

  const rawText = await response.text();
  if (!response.ok) {
    const message = extractUpstreamError(rawText, 'OpenAI quick analysis request failed');
    throw new AppError(message, 502, 'AI_UPSTREAM_ERROR', {
      provider: 'openai',
      status: response.status,
      model: config.OPENAI_FAST_MODEL || config.OPENAI_MODEL,
      body: rawText.slice(0, 600),
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (_) {
    throw new AppError('OpenAI quick analysis returned invalid JSON payload', 502, 'AI_UPSTREAM_ERROR');
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new AppError('OpenAI quick analysis returned empty output', 502, 'AI_EMPTY_OUTPUT');
  }

  const parsed = parseJsonFromText(outputText);
  return {
    ...parsed,
    _pipeline: 'EAFC_QUICK',
    _suggestedFieldCount: extractSuggestedFieldCount(parsed),
  };
}

async function analyzeWithEAFCQuick(files) {
  if (typeof fetch !== 'function') {
    throw new AppError('Runtime does not support fetch for AI analysis', 500, 'AI_RUNTIME_ERROR');
  }

  const quickFiles = Array.isArray(files) ? files.slice(0, 2) : [];
  const openAiResult = await callOpenAIQuick(quickFiles);
  if (openAiResult) return openAiResult;

  const geminiResult = await callGeminiQuick(quickFiles);
  if (geminiResult) return geminiResult;

  throw new AppError(
    'AI analysis is not configured. Set OPENAI_API_KEY (preferred) or GEMINI_API_KEY in backend/.env',
    400,
    'AI_NOT_CONFIGURED',
  );
}

async function analyzeWithAI(files) {
  if (typeof fetch !== 'function') {
    throw new AppError('Runtime does not support fetch for AI analysis', 500, 'AI_RUNTIME_ERROR');
  }

  const openAiResult = await callOpenAI(files);
  if (openAiResult) return openAiResult;

  const geminiResult = await callGemini(files);
  if (geminiResult) return geminiResult;

  throw new AppError(
    'AI analysis is not configured. Set OPENAI_API_KEY (preferred) or GEMINI_API_KEY in backend/.env',
    400,
    'AI_NOT_CONFIGURED',
  );
}

module.exports = {
  analyzeWithEAFCQuick,
  analyzeWithAI,
};
