/** DOM-Zugriff und Darstellung; keine Berechnungen oder Persistenz. */
export function cacheElements(root = document) {
  return {
    form: root.querySelector('#calculator-form'),
    resetButton: root.querySelector('#reset-button'),
    saveButton: root.querySelector('#save-button'),
    clearSavedButton: root.querySelector('#clear-saved-button'),
    formStatus: root.querySelector('#form-status'),
    resultsPlaceholder: root.querySelector('#results-placeholder'),
    chartsPlaceholder: root.querySelector('#charts-placeholder'),
    resultsSection: root.querySelector('#results-section'),
    explanationPlaceholder: root.querySelector('#explanation-placeholder')
  };
}

export function readFormInputs(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function renderInitialState(elements) {
  if (!elements?.resultsPlaceholder) return;
  elements.resultsPlaceholder.setAttribute('aria-busy', 'false');
}

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const hours = (value) => `${integer.format(Math.max(0, value))} Std.`;
const money = (value) => euro.format(Math.max(0, Number.isFinite(value) ? value : 0));

function metric(label, value, primary = false) {
  const article = document.createElement('article');
  article.className = primary ? 'result-metric result-primary' : 'result-metric';
  const title = document.createElement('h3'); title.className = 'result-label'; title.textContent = label;
  const number = document.createElement('p'); number.className = 'result-value'; number.textContent = value;
  article.append(title, number); return article;
}

export function renderResults(result, elements) {
  if (!elements?.resultsPlaceholder) return;
  elements.resultsPlaceholder.replaceChildren();
  if (!result) return;
  const grid = document.createElement('div'); grid.className = 'results-grid';
  grid.append(metric('Effektiver Netto-Stundenlohn', money(result.effectiveHourlyRate), true));
  grid.append(metric('Klassischer Netto-Stundenlohn', money(result.classicNetHourlyRate)));
  grid.append(metric('Nettoeinkommen pro Jahr', money(result.netAnnual)));
  grid.append(metric('Fahrtkosten pro Jahr', money(result.commuteCostAnnual)));
  grid.append(metric('Pendelzeit pro Jahr', hours(result.commuteHoursAnnual)));
  grid.append(metric('Gesamte aufgewendete Zeit', hours(result.totalTimeAnnual)));
  grid.append(metric('Abgaben insgesamt', money(result.deductionsAnnual)));
  elements.resultsPlaceholder.append(grid);
  const compare = document.createElement('div'); compare.className = 'comparison-box';
  const compareTitle = document.createElement('h3'); compareTitle.textContent = 'Vergleich';
  const compareText = document.createElement('p'); compareText.textContent = `${money(result.classicNetHourlyRate)} ohne Pendelzeit vs. ${money(result.effectiveHourlyRate)} real inklusive Pendelzeit und Fahrtkosten. Differenz: ${money(result.hourlyDifference)} (${result.reductionPercent.toFixed(1).replace('.', ',')} % Reduktion).`;
  compare.append(compareTitle, compareText); elements.resultsPlaceholder.append(compare);
  const hints = document.createElement('ul'); hints.className = 'result-hints';
  if (result.totalTimeAnnual > 0 && result.commuteHoursAnnual / result.totalTimeAnnual >= 0.2) { const item = document.createElement('li'); item.textContent = 'Pendeln macht einen hohen Anteil deiner insgesamt aufgewendeten Zeit aus.'; hints.append(item); }
  if (result.netAnnual > 0 && result.commuteCostAnnual / result.netAnnual >= 0.1) { const item = document.createElement('li'); item.textContent = 'Die Fahrtkosten machen einen hohen Anteil deines Nettoeinkommens aus.'; hints.append(item); }
  if (result.reductionPercent >= 20) { const item = document.createElement('li'); item.textContent = 'Der effektive Stundenlohn liegt deutlich unter dem klassischen Wert.'; hints.append(item); }
  if (hints.childElementCount) elements.resultsPlaceholder.append(hints);
  elements.resultsPlaceholder.setAttribute('aria-live', 'polite');
  elements.resultsPlaceholder.setAttribute('aria-label', `Effektiver Netto-Stundenlohn: ${money(result.effectiveHourlyRate)}`);
}

export function renderState(state, elements) {
  if (!elements?.form) return;
  for (const [name, value] of Object.entries(state.inputs || {})) {
    const field = elements.form.elements.namedItem(name);
    if (field && document.activeElement !== field) field.value = value;
  }
}

export function clearValidation(form) {
  form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-error-for], [data-field-error]').forEach((message) => { message.textContent = ''; });
}

export function validateForm(form) {
  clearValidation(form);
  const invalidFields = [...form.querySelectorAll('[required]')].filter((field) => !field.checkValidity());
  invalidFields.forEach((field) => {
    field.setAttribute('aria-invalid', 'true');
    const message = field.closest('.field')?.querySelector('[data-field-error]') || form.querySelector(`[data-error-for="${field.id}"]`);
    if (message) message.textContent = field.validity.valueMissing ? 'Dieses Feld ist erforderlich.' : 'Bitte gib einen gültigen Wert ein.';
  });
  return invalidFields;
}

export function renderCalculationErrors(form, errors = []) {
  clearValidation(form);
  errors.forEach(({ field, message }) => {
    const input = form.elements.namedItem(field);
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const container = input.closest('.field');
    let error = container?.querySelector('[data-field-error]') || container?.querySelector('[data-error-for]');
    if (container && !error) {
      error = document.createElement('p');
      error.className = 'error-message';
      error.dataset.fieldError = '';
      error.id = `${input.id}-error`;
      error.setAttribute('role', 'alert');
      container.append(error);
    }
    if (error) {
      error.textContent = message;
      input.setAttribute('aria-describedby', error.id);
    }
  });
}

export function setFormStatus(elements, message) {
  if (elements?.formStatus) elements.formStatus.textContent = message;
}
