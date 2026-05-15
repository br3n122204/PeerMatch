const MIN_BUDGET = 50;
const MAX_BUDGET = 100_000;

function parseBudget(value) {
  if (value === null || value === undefined || value === '') {
    return { ok: false, message: 'Budget (PHP) is required.' };
  }
  const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { ok: false, message: 'Budget must be a whole number of Philippine Pesos.' };
  }
  if (num < MIN_BUDGET) {
    return { ok: false, message: `Minimum budget is ₱${MIN_BUDGET.toLocaleString('en-PH')}.` };
  }
  if (num > MAX_BUDGET) {
    return { ok: false, message: `Maximum budget is ₱${MAX_BUDGET.toLocaleString('en-PH')}.` };
  }
  return { ok: true, budget: num };
}

module.exports = {
  MIN_BUDGET,
  MAX_BUDGET,
  parseBudget,
};
