const { MIN_BUDGET, MAX_BUDGET } = require('../utils/budgetValidation');

function roundToFifty(value) {
  return Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, Math.round(value / 50) * 50));
}

function urgencyMultiplier(urgency) {
  const u = String(urgency || 'normal').toLowerCase();
  if (u === 'high') return 1.2;
  if (u === 'low') return 0.9;
  return 1;
}

/** Rule-based ranges when OpenAI is unavailable */
function suggestBudgetHeuristic({ title, description, subjectCategory, urgency }) {
  const text = `${title} ${description} ${subjectCategory}`.toLowerCase();
  let baseMin = 300;
  let baseMax = 1200;

  if (/(tutor|tutoring|session|review|quiz|exam prep)/.test(text)) {
    baseMin = 250;
    baseMax = 900;
  } else if (/(design|poster|logo|graphic|layout|canva)/.test(text)) {
    baseMin = 400;
    baseMax = 2200;
  } else if (/(research|thesis|dissertation|literature|paper|capstone)/.test(text)) {
    baseMin = 1200;
    baseMax = 5500;
  } else if (/(program|code|coding|debug|website|app|software|it\b)/.test(text)) {
    baseMin = 600;
    baseMax = 4000;
  } else if (/(errand|moving|delivery|pickup|grocery|commute)/.test(text)) {
    baseMin = 100;
    baseMax = 450;
  } else if (/(write|essay|report|assignment|homework)/.test(text)) {
    baseMin = 350;
    baseMax = 1800;
  }

  const mult = urgencyMultiplier(urgency);
  const minBudget = roundToFifty(baseMin * mult);
  const maxBudget = roundToFifty(Math.max(minBudget + 50, baseMax * mult));
  const suggestedBudget = roundToFifty((minBudget + maxBudget) / 2);

  return {
    minBudget,
    maxBudget,
    suggestedBudget,
    rationale:
      'Estimated from typical student peer-help rates in the Philippines (small tasks to multi-session academic work).',
    source: 'heuristic',
  };
}

async function suggestBudgetWithOpenAI({ title, description, subjectCategory, urgency }) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return suggestBudgetHeuristic({ title, description, subjectCategory, urgency });
  }

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const systemPrompt = `You advise fair compensation for PeerMatch, a Philippine university student collaboration platform.
All amounts are in Philippine Peso (PHP), whole integers only.
Rates must be realistic for students (not professional agency pricing): quick errands ₱100–450, tutoring ₱250–900, design ₱400–2200, coding help ₱600–4000, research/capstone ₱1200–5500.
Urgency "${urgency}" may shift ranges slightly (high: modest premium; low: modest discount).
Respond with JSON only: {"minBudget":number,"maxBudget":number,"suggestedBudget":number,"rationale":"one short sentence"}.`;

  const userPrompt = `Category: ${subjectCategory}
Title: ${title}
Description: ${description}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    console.error('OpenAI suggest-budget error:', response.status, await response.text());
    return suggestBudgetHeuristic({ title, description, subjectCategory, urgency });
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) {
    return suggestBudgetHeuristic({ title, description, subjectCategory, urgency });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return suggestBudgetHeuristic({ title, description, subjectCategory, urgency });
  }

  let minBudget = roundToFifty(Number(parsed.minBudget));
  let maxBudget = roundToFifty(Number(parsed.maxBudget));
  let suggestedBudget = roundToFifty(Number(parsed.suggestedBudget));

  if (!Number.isFinite(minBudget) || !Number.isFinite(maxBudget) || !Number.isFinite(suggestedBudget)) {
    return suggestBudgetHeuristic({ title, description, subjectCategory, urgency });
  }

  if (maxBudget < minBudget) {
    [minBudget, maxBudget] = [maxBudget, minBudget];
  }
  if (suggestedBudget < minBudget) suggestedBudget = minBudget;
  if (suggestedBudget > maxBudget) suggestedBudget = maxBudget;

  return {
    minBudget,
    maxBudget,
    suggestedBudget,
    rationale: String(parsed.rationale || '').trim().slice(0, 280) ||
      'AI-suggested range based on your post details and typical student rates.',
    source: 'ai',
  };
}

module.exports = {
  suggestBudgetWithOpenAI,
  suggestBudgetHeuristic,
};
