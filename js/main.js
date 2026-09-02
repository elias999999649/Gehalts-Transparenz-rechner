import { getState, resetState, setState, subscribe } from './state.js';
import { calculateNetHourlyWage } from './calculations.js';
import { cacheElements, readFormInputs, renderCalculationErrors, renderInitialState, renderResults, renderState, setFormStatus, validateForm } from './ui.js';
import { clearSavedState, loadState, saveState } from './storage.js';
import { renderCharts } from './charts.js';

function initializeApp() {
  const elements = cacheElements();
  const savedState = loadState();

  if (savedState) setState(savedState);
  const initialInputs = getState().inputs;
  const initialCalculation = calculateNetHourlyWage(initialInputs);
  if (initialCalculation.valid) setState({ result: initialCalculation.result });

  renderInitialState(elements);
  renderState(getState(), elements);
  renderResults(getState().result, elements);
  renderCharts(getState().result, elements.chartsPlaceholder);
  elements.form?.addEventListener('input', () => {
    setState({ inputs: readFormInputs(elements.form), result: null });
  });
  elements.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (validateForm(elements.form).length) {
      setState({ result: null });
      setFormStatus(elements, 'Bitte prüfe die markierten Pflichtfelder.');
      elements.form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const inputs = readFormInputs(elements.form);
    const calculation = calculateNetHourlyWage(inputs);
    if (!calculation.valid) {
      renderCalculationErrors(elements.form, calculation.errors);
      setState({ inputs, result: null });
      setFormStatus(elements, 'Bitte prüfe die markierten Eingaben.');
      elements.form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setState({ inputs, result: calculation.result });
    setFormStatus(elements, 'Eingaben übernommen. Berechnungsdaten wurden aktualisiert.');
  });
  elements.resetButton?.addEventListener('click', () => {
    resetState();
    setFormStatus(elements, 'Eingaben wurden auf die Standardwerte zurückgesetzt.');
  });
  elements.saveButton?.addEventListener('click', () => {
    saveState(getState());
    setFormStatus(elements, 'Eingaben wurden lokal gespeichert.');
  });
  elements.clearSavedButton?.addEventListener('click', () => {
    resetState();
    clearSavedState();
    setFormStatus(elements, 'Gespeicherte Eingaben wurden gelöscht und das Formular zurückgesetzt.');
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
