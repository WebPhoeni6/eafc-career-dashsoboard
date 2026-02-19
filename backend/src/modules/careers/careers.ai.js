const config = require('../../config/env');
const { AppError } = require('../../middlewares/error');

function normalizeModelName(model) {
  const raw = String(model || '').trim();
  return raw.replace(/^models\//i, '') || 'gemini-2.5-flash';
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
    // ignore parse error
  }
  return rawText.slice(0, 220).trim() || fallbackMessage;
}

function buildPrompt(context) {
  const playerName = context?.career?.playerName ? String(context.career.playerName).trim() : 'Player';
  const club = context?.career?.club ? String(context.career.club).trim() : 'current club';

  return [
    'You are a personalized performance analyst for an EAFC 26 player career tracker.',
    'Analyze the provided JSON context and return ONLY valid JSON (no markdown).',
    `Write in second person and address the player as "${playerName}" when it feels natural.`,
    `Do not describe ${playerName} as a third party.`,
    'Output shape:',
    '{',
    '  "summary": "short overall assessment",',
    '  "momentum": "improving|stable|declining",',
    '  "confidence": 0.0,',
    '  "strengths": ["..."],',
    '  "concerns": ["..."],',
    '  "recommendations": {',
    '    "nextMatch": ["..."],',
    '    "training": ["..."],',
    '    "season": ["..."],',
    '    "transfers": ["..."]',
    '  },',
    '  "recommendationRationale": {',
    '    "nextMatch": "short why for next-match suggestions",',
    '    "training": "short why for training suggestions",',
    '    "season": "short why for season-plan suggestions",',
    '    "transfers": "short why for transfer suggestions"',
    '  },',
    '  "milestoneSuggestions": [{ "label": "...", "target": 10, "unit": "goals", "why": "short reason" }],',
    '  "keyMetricsToWatch": ["..."],',
    '  "recentFormSnapshot": "short recent-form summary"',
    '}',
    'Rules:',
    '- Use recent performances and whole-career context together.',
    '- Be specific and actionable.',
    '- confidence must be 0..1.',
    '- Transfer recommendations MUST use modules.offers and modules.contracts from the context as primary evidence.',
    '- In EAFC 26 player career mode, do not assume transfer fee/value fields exist if they are not present.',
    '- Do not invent wage numbers or offer amounts; if missing, explicitly say they are not logged and base advice on available signals.',
    '- For transfer strategy, prioritize fit signals available in context: club, role, status, hasUCL, score, contract period, and historical output (apps/goals/assists).',
    '- If transfer data is sparse, say that clearly and give low-risk next steps for logging better offers/contracts.',
    '- Keep transfer advice grounded in the player path from the current club (' + club + ') and recent form.',
    '- recommendationRationale should explain the recommendation blocks in one short sentence each.',
    '- milestoneSuggestions should contain 0 to 4 realistic, trackable targets with numeric target values.',
    '- milestoneSuggestions[].why should be a short reason tied to context metrics.',
    '',
    `Context JSON: ${JSON.stringify(context)}`,
  ].join('\n');
}

function buildQuestionPrompt(context, question) {
  const cleanQuestion = String(question || '').trim();
  const playerName = context?.career?.playerName ? String(context.career.playerName).trim() : 'Player';

  return [
    'You are a personalized performance analyst for an EAFC 26 player career tracker.',
    'Answer the user question using ONLY the provided career context.',
    'Return ONLY valid JSON (no markdown) with this shape:',
    '{',
    '  "answer": "concise, actionable answer",',
    '  "why": "short reason based on context evidence",',
    '  "confidence": 0.0',
    '}',
    'Rules:',
    `- Address the player as "${playerName}" in second person where natural.`,
    '- Do not invent facts that are not in context.',
    '- If data is missing, say exactly what is missing and what to log next.',
    '- confidence must be a number between 0 and 1.',
    '',
    `Question: ${cleanQuestion}`,
    `Context JSON: ${JSON.stringify(context)}`,
  ].join('\n');
}

async function callGemini(prompt) {
  if (!config.GEMINI_API_KEY) return null;

  const modelCandidates = Array.from(
    new Set([normalizeModelName(config.GEMINI_MODEL), 'gemini-2.0-flash', 'gemini-1.5-flash']),
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
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
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
    if (!outputText) throw new AppError('Gemini analysis returned empty output', 502, 'AI_EMPTY_OUTPUT');
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

async function callOpenAI(prompt) {
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
        input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
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
  if (!outputText) throw new AppError('OpenAI analysis returned empty output', 502, 'AI_EMPTY_OUTPUT');
  return parseJsonFromText(outputText);
}

async function analyzeCareerContext(context) {
  if (typeof fetch !== 'function') {
    throw new AppError('Runtime does not support fetch for AI analysis', 500, 'AI_RUNTIME_ERROR');
  }

  const prompt = buildPrompt(context);
  const openAiResult = await callOpenAI(prompt);
  if (openAiResult) return openAiResult;

  const geminiResult = await callGemini(prompt);
  if (geminiResult) return geminiResult;

  throw new AppError(
    'AI analysis is not configured. Set OPENAI_API_KEY (preferred) or GEMINI_API_KEY in backend/.env',
    400,
    'AI_NOT_CONFIGURED',
  );
}

async function answerCareerQuestion(context, question) {
  if (typeof fetch !== 'function') {
    throw new AppError('Runtime does not support fetch for AI analysis', 500, 'AI_RUNTIME_ERROR');
  }

  const prompt = buildQuestionPrompt(context, question);
  const openAiResult = await callOpenAI(prompt);
  if (openAiResult) return openAiResult;

  const geminiResult = await callGemini(prompt);
  if (geminiResult) return geminiResult;

  throw new AppError(
    'AI analysis is not configured. Set OPENAI_API_KEY (preferred) or GEMINI_API_KEY in backend/.env',
    400,
    'AI_NOT_CONFIGURED',
  );
}

module.exports = {
  analyzeCareerContext,
  answerCareerQuestion,
};
