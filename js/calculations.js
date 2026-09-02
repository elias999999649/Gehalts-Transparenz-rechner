/** Reine Berechnungsfunktionen. Geld- und Zeitwerte bleiben intern ungerundet. */
export const DAYS_PER_YEAR = 365;
export const WEEKS_PER_YEAR = 52;

const REQUIRED_FIELDS = new Set(['grossIncome', 'hoursPerDay', 'daysPerWeek']);
const RULES = {
  grossIncome: [0, 10000000], hoursPerDay: [0, 24], daysPerWeek: [1, 7],
  breakPerDay: [0, 12], vacationDays: [0, 365], freeDays: [0, 365],
  distanceKm: [0, 5000], travelTime: [0, 1440], commuteDays: [0, 7],
  costPerKm: [0, 100], taxRate: [0, 100], socialRate: [0, 100], otherDeductions: [0, 1000000]
};

const number = (value) => {
  if (value === '' || value === null || value === undefined) return NaN;
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export function validateInputs(inputs = {}) {
  const errors = [];
  for (const [key, [min, max]] of Object.entries(RULES)) {
    const value = number(inputs[key]);
    if (inputs[key] === '' || inputs[key] === undefined || inputs[key] === null) {
      if (REQUIRED_FIELDS.has(key)) errors.push({ field: key, code: 'required', message: 'Dieses Feld ist erforderlich.' });
      continue;
    }
    if (!Number.isFinite(value)) errors.push({ field: key, code: 'invalid-number', message: 'Bitte gib eine gültige Zahl ein.' });
    else if (value < min || value > max) errors.push({ field: key, code: 'out-of-range', message: `Der Wert muss zwischen ${min} und ${max} liegen.` });
  }
  if (!['monthly', 'yearly', 'hourly'].includes(inputs.incomeInterval)) errors.push({ field: 'incomeInterval', code: 'invalid-option', message: 'Bitte wähle ein gültiges Gehaltsintervall.' });
  if (!['car', 'public', 'bike', 'walk', 'other'].includes(inputs.transportMode)) errors.push({ field: 'transportMode', code: 'invalid-option', message: 'Bitte wähle ein gültiges Verkehrsmittel.' });
  if (number(inputs.hoursPerDay) <= 0) errors.push({ field: 'hoursPerDay', code: 'zero-work-time', message: 'Die Arbeitszeit muss größer als null sein.' });
  if (number(inputs.breakPerDay) > number(inputs.hoursPerDay)) errors.push({ field: 'breakPerDay', code: 'inconsistent', message: 'Die Pause darf nicht länger als die Arbeitszeit sein.' });
  if (number(inputs.taxRate) + number(inputs.socialRate) > 100) errors.push({ field: 'taxRate', code: 'inconsistent', message: 'Steuer- und Sozialabgaben dürfen zusammen höchstens 100 % betragen.' });
  return { valid: errors.length === 0, errors };
}

export function normalizeInputs(inputs = {}) {
  const normalized = Object.fromEntries(Object.keys(RULES).map((key) => {
    const value = number(inputs[key]);
    return [key, Number.isFinite(value) ? value : 0];
  }));
  return { ...normalized, incomeInterval: inputs.incomeInterval || 'monthly', transportMode: inputs.transportMode || 'car' };
}

export function calculateTimeSummary(inputs) {
  const value = normalizeInputs(inputs);
  const workDaysScheduled = value.daysPerWeek * WEEKS_PER_YEAR;
  const workDaysAnnual = Math.max(0, Math.min(workDaysScheduled, workDaysScheduled - value.vacationDays - value.freeDays));
  const commuteDaysAnnual = Math.min(workDaysAnnual, value.commuteDays * WEEKS_PER_YEAR);
  const paidHoursAnnual = value.hoursPerDay * workDaysAnnual;
  const unpaidBreakHoursAnnual = value.breakPerDay * workDaysAnnual;
  const workplaceHoursAnnual = paidHoursAnnual + unpaidBreakHoursAnnual;
  const commuteHoursAnnual = (value.travelTime * 2 / 60) * commuteDaysAnnual;
  return {
    workDaysScheduled, workDaysAnnual, commuteDaysAnnual, paidHoursAnnual,
    unpaidBreakHoursAnnual, workplaceHoursAnnual, commuteHoursAnnual,
    totalTimeAnnual: workplaceHoursAnnual + commuteHoursAnnual,
    paidHoursWeekly: value.hoursPerDay * value.daysPerWeek,
    workplaceHoursWeekly: (value.hoursPerDay + value.breakPerDay) * value.daysPerWeek,
    commuteHoursPerDay: value.travelTime * 2 / 60
  };
}

/* Modularer Abgabenbaustein: kann später durch ein länderspezifisches Modell ersetzt werden. */
export function calculateDeductions(grossAnnual, inputs) {
  const taxAnnual = Math.max(0, grossAnnual * inputs.taxRate / 100);
  const socialAnnual = Math.max(0, grossAnnual * inputs.socialRate / 100);
  const otherAnnual = Math.max(0, inputs.otherDeductions * 12);
  return { taxAnnual, socialAnnual, otherAnnual, totalAnnual: taxAnnual + socialAnnual + otherAnnual };
}

export function calculateNetHourlyWage(inputs) {
  const validation = validateInputs(inputs);
  if (!validation.valid) return { valid: false, errors: validation.errors, result: null };
  const value = normalizeInputs(inputs);
  const time = calculateTimeSummary(value);
  const grossAnnual = value.incomeInterval === 'monthly' ? value.grossIncome * 12 : value.incomeInterval === 'yearly' ? value.grossIncome : value.grossIncome * time.paidHoursAnnual;
  const deductions = calculateDeductions(grossAnnual, value);
  const deductionsAnnual = deductions.totalAnnual;
  const netAnnual = Math.max(0, grossAnnual - deductionsAnnual);
  const commuteCostPerDay = value.distanceKm * 2 * value.costPerKm;
  const commuteCostAnnual = commuteCostPerDay * time.commuteDaysAnnual;
  const netAfterCommuteCosts = Math.max(0, netAnnual - commuteCostAnnual);
  const classicNetHourlyRate = time.paidHoursAnnual > 0 ? netAnnual / time.paidHoursAnnual : 0;
  const effectiveHourlyRate = time.totalTimeAnnual > 0 ? netAfterCommuteCosts / time.totalTimeAnnual : 0;
  if (![grossAnnual, ...Object.values(deductions), netAnnual, commuteCostAnnual, netAfterCommuteCosts, classicNetHourlyRate, effectiveHourlyRate, hourlyDifference, reductionPercent].every(Number.isFinite)) {
    return { valid: false, errors: [{ field: 'grossIncome', code: 'calculation-error', message: 'Die Werte sind zu groß für eine sichere Berechnung.' }], result: null };
  }
  const hourlyDifference = Math.max(0, classicNetHourlyRate - effectiveHourlyRate);
  const reductionPercent = classicNetHourlyRate > 0 ? hourlyDifference / classicNetHourlyRate * 100 : 0;
  return { valid: true, errors: [], result: { grossAnnual, netAnnual, ...deductions, workDaysAnnual: time.workDaysAnnual, paidHoursAnnual: time.paidHoursAnnual, unpaidBreakHoursAnnual: time.unpaidBreakHoursAnnual, workplaceHoursAnnual: time.workplaceHoursAnnual, commuteHoursAnnual: time.commuteHoursAnnual, totalTimeAnnual: time.totalTimeAnnual, commuteCostPerDay, commuteCostMonthly: commuteCostAnnual / 12, commuteCostAnnual, deductionsAnnual, classicNetHourlyRate, effectiveHourlyRate, hourlyDifference, reductionPercent, netAfterCommuteCosts, time } };
}

/* Manuelle Testfälle bleiben außerhalb des Produktpfads und werden bei Bedarf aus der Konsole importiert. */
export function runCalculationTests() {
  const base = { grossIncome: 4000, incomeInterval: 'monthly', hoursPerDay: 8, daysPerWeek: 5, breakPerDay: 0.5, vacationDays: 30, freeDays: 11, distanceKm: 15, transportMode: 'car', travelTime: 30, commuteDays: 5, costPerKm: 0.3, taxRate: 25, socialRate: 20, otherDeductions: 0 };
  const result = calculateNetHourlyWage(base).result;
  const hourly = calculateNetHourlyWage({ ...base, incomeInterval: 'hourly', grossIncome: 30 }).result;
  const expensive = calculateNetHourlyWage({ ...base, distanceKm: 100, costPerKm: 1 }).result;
  const checks = [result.workDaysAnnual === 219, result.commuteHoursAnnual === 219, result.commuteCostAnnual === 219 * 9, calculateNetHourlyWage({ ...base, travelTime: 0 }).result.commuteHoursAnnual === 0, calculateNetHourlyWage({ ...base, breakPerDay: 1 }).result.unpaidBreakHoursAnnual === 219, calculateNetHourlyWage({ ...base, incomeInterval: 'yearly', grossIncome: 48000 }).result.grossAnnual === 48000, hourly.grossAnnual === 30 * 1752, expensive.effectiveHourlyRate < result.effectiveHourlyRate, !calculateNetHourlyWage({ ...base, hoursPerDay: 0 }).valid, !calculateNetHourlyWage({ ...base, taxRate: 90, socialRate: 20 }).valid];
  return { passed: checks.filter(Boolean).length, total: checks.length, success: checks.every(Boolean) };
}
