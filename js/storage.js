import { defaultInputs } from './state.js';
import { validateInputs } from './calculations.js';

export const STORAGE_KEY = 'gehalts-transparenz-rechner:v1';
const STORAGE_VERSION = 1;
const INPUT_KEYS = Object.keys(defaultInputs);

function isValidInputs(inputs) {
  if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) return false;
  if (!INPUT_KEYS.every((key) => Object.prototype.hasOwnProperty.call(inputs, key))) return false;
  return validateInputs(inputs).valid;
}

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || parsed.version !== STORAGE_VERSION || !isValidInputs(parsed.inputs)) return null;
    return { inputs: Object.fromEntries(INPUT_KEYS.map((key) => [key, parsed.inputs[key]])), result: null };
  } catch (_error) { return null; }
}

export function saveState(state) {
  try {
    const inputs = Object.fromEntries(INPUT_KEYS.map((key) => [key, state?.inputs?.[key]]));
    if (isValidInputs(inputs)) localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, inputs }));
  } catch (_error) { /* LocalStorage darf ausfallen, ohne die App zu stoppen. */ }
}

export function clearSavedState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_error) { /* defensiver No-op */ }
}
