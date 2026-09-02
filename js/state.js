/** Zentraler, serialisierbarer Anwendungszustand. */
export const defaultInputs = Object.freeze({
  grossIncome: 4000, incomeInterval: "monthly", hoursPerDay: 8, daysPerWeek: 5,
  breakPerDay: 0.5, vacationDays: 30, freeDays: 11, distanceKm: 15,
  transportMode: "car", travelTime: 30, commuteDays: 5, costPerKm: 0.3,
  taxRate: 25, socialRate: 20, otherDeductions: 0
});

const initialState = Object.freeze({
  inputs: { ...defaultInputs }, result: null, lastUpdated: null
});

let currentState = { ...initialState, inputs: { ...defaultInputs } };
const listeners = new Set();

export function getState() {
  return currentState;
}

export function setState(partialState) {
  currentState = {
    ...currentState,
    ...partialState,
    inputs: { ...currentState.inputs, ...(partialState.inputs || {}) },
    lastUpdated: new Date().toISOString()
  };
  listeners.forEach((listener) => listener(currentState));
  return currentState;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetState() {
  currentState = { ...initialState, inputs: { ...defaultInputs } };
  listeners.forEach((listener) => listener(currentState));
}
