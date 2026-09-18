import { getState, resetState, setState, subscribe, defaultInputs } from './state.js';
import { calculateNetHourlyWage, validateInputs } from './calculations.js';
import { cacheElements, readFormInputs, renderCalculationErrors, renderInitialState, renderResults, renderState, setFormStatus, validateForm, showToast } from './ui.js';
import { clearSavedState, loadState, saveState } from './storage.js';
import { renderCharts } from './charts.js';

const presets = {
  standard: { ...defaultInputs },
  junior: { grossIncome: 2600, incomeInterval: 'monthly', hoursPerDay: 8, daysPerWeek: 5, breakPerDay: 0.5, vacationDays: 28, freeDays: 10, distanceKm: 5, transportMode: 'public', travelTime: 20, commuteDays: 5, costPerKm: 0.2, taxRate: 18, socialRate: 20, otherDeductions: 0 },
  senior: { grossIncome: 5800, incomeInterval: 'monthly', hoursPerDay: 8, daysPerWeek: 5, breakPerDay: 0.5, vacationDays: 30, freeDays: 11, distanceKm: 0, transportMode: 'walk', travelTime: 0, commuteDays: 0, costPerKm: 0.3, taxRate: 30, socialRate: 20, otherDeductions: 0 },
  commuter: { grossIncome: 4500, incomeInterval: 'monthly', hoursPerDay: 8, daysPerWeek: 5, breakPerDay: 0.5, vacationDays: 30, freeDays: 11, distanceKm: 40, transportMode: 'car', travelTime: 50, commuteDays: 5, costPerKm: 0.3, taxRate: 26, socialRate: 20, otherDeductions: 0 }
};

function initializeApp() {
  const elements = cacheElements();
  const savedState = loadState();

  if (savedState) {
    setState(savedState);
  }

  const initialInputs = getState().inputs;
  const initialCalculation = calculateNetHourlyWage(initialInputs);
  if (initialCalculation.valid) {
    setState({ result: initialCalculation.result });
  }

  renderInitialState(elements);
  renderState(getState(), elements);
  renderResults(getState().result, elements);
  renderCharts(getState().result, elements.chartsPlaceholder);

  // Live calculation on every input change
  elements.form?.addEventListener('input', () => {
    const inputs = readFormInputs(elements.form);
    setState({ inputs });
    
    const validation = validateInputs(inputs);
    if (validation.valid) {
      const calculation = calculateNetHourlyWage(inputs);
      if (calculation.valid) {
        setState({ result: calculation.result });
        renderCalculationErrors(elements.form, []);
      } else {
        setState({ result: null });
      }
    } else {
      setState({ result: null });
    }
  });

  elements.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (validateForm(elements.form).length) {
      setState({ result: null });
      setFormStatus(elements, 'Bitte prüfe die markierten Pflichtfelder.');
      showToast('Bitte prüfe die markierten Pflichtfelder.');
      elements.form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const inputs = readFormInputs(elements.form);
    const calculation = calculateNetHourlyWage(inputs);
    if (!calculation.valid) {
      renderCalculationErrors(elements.form, calculation.errors);
      setState({ inputs, result: null });
      setFormStatus(elements, 'Bitte prüfe die markierten Eingaben.');
      showToast('Bitte prüfe die markierten Eingaben.');
      elements.form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setState({ inputs, result: calculation.result });
    setFormStatus(elements, 'Berechnung erfolgreich aktualisiert.');
    showToast('Berechnung aktualisiert!');
  });

  // Preset button handlers
  elements.presetButtons?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const presetInputs = presets[presetKey];
      if (presetInputs) {
        setState({ inputs: { ...presetInputs } });
        renderState(getState(), elements);
        const calc = calculateNetHourlyWage(presetInputs);
        if (calc.valid) setState({ result: calc.result });
        showToast(`Vorlage "${btn.textContent.trim()}" geladen.`);
      }
    });
  });

  elements.resetButton?.addEventListener('click', () => {
    resetState();
    const calc = calculateNetHourlyWage(getState().inputs);
    if (calc.valid) setState({ result: calc.result });
    renderState(getState(), elements);
    setFormStatus(elements, 'Eingaben wurden auf die Standardwerte zurückgesetzt.');
    showToast('Auf Standardwerte zurückgesetzt.');
  });

  elements.saveButton?.addEventListener('click', () => {
    saveState(getState());
    setFormStatus(elements, 'Eingaben wurden lokal gespeichert.');
    showToast('Eingaben lokal gespeichert!');
  });

  elements.clearSavedButton?.addEventListener('click', () => {
    resetState();
    clearSavedState();
    const calc = calculateNetHourlyWage(getState().inputs);
    if (calc.valid) setState({ result: calc.result });
    renderState(getState(), elements);
    setFormStatus(elements, 'Gespeicherte Eingaben wurden gelöscht.');
    showToast('Gespeicherte Eingaben gelöscht.');
    elements.form?.querySelector('input, select')?.focus();
  });

  subscribe((state) => {
    renderState(state, elements);
    renderResults(state.result, elements);
    renderCharts(state.result, elements.chartsPlaceholder);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
  initializeApp();
}
