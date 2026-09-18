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
    explanationPlaceholder: root.querySelector('#explanation-placeholder'),
    presetButtons: root.querySelectorAll('[data-preset]')
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
  if (!result) {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML = `
      <span class="placeholder-icon" aria-hidden="true">€</span>
      <p class="font-bold text-slate-700">Ergebnisbereich</p>
      <p class="mt-1 text-sm text-slate-500">Gib deine Werte ein, um die Live-Berechnung zu starten.</p>
    `;
    elements.resultsPlaceholder.append(placeholder);
    return;
  }

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
  const compareTitle = document.createElement('h3'); compareTitle.textContent = 'Vergleich & Reduktion';
  const compareText = document.createElement('p'); 
  compareText.textContent = `${money(result.classicNetHourlyRate)} ohne Pendelzeit vs. ${money(result.effectiveHourlyRate)} real inklusive Pendelzeit und Fahrtkosten. Differenz: ${money(result.hourlyDifference)} (${result.reductionPercent.toFixed(1).replace('.', ',')} % Reduktion).`;
  compare.append(compareTitle, compareText); 
  elements.resultsPlaceholder.append(compare);

  const hints = document.createElement('ul'); hints.className = 'result-hints';
  if (result.totalTimeAnnual > 0 && result.commuteHoursAnnual / result.totalTimeAnnual >= 0.2) { 
    const item = document.createElement('li'); 
    item.textContent = 'Pendeln macht einen hohen Anteil deiner insgesamt aufgewendeten Zeit aus.'; 
    hints.append(item); 
  }
  if (result.netAnnual > 0 && result.commuteCostAnnual / result.netAnnual >= 0.1) { 
    const item = document.createElement('li'); 
    item.textContent = 'Die Fahrtkosten machen einen hohen Anteil deines Nettoeinkommens aus.'; 
    hints.append(item); 
  }
  if (result.reductionPercent >= 20) { 
    const item = document.createElement('li'); 
    item.textContent = 'Der effektive Stundenlohn liegt deutlich unter dem klassischen Wert.'; 
    hints.append(item); 
  }
  if (hints.childElementCount) elements.resultsPlaceholder.append(hints);

  // Result Action Buttons (Copy & Print)
  const actionWrap = document.createElement('div');
  actionWrap.className = 'result-actions';
  
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'button button-secondary';
  copyBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg> Ergebnis kopieren';
  copyBtn.addEventListener('click', () => {
    const summaryText = `Gehalts-Transparenz-Rechner Ergebnis:\n• Effektiver Netto-Stundenlohn: ${money(result.effectiveHourlyRate)}\n• Klassischer Netto-Stundenlohn: ${money(result.classicNetHourlyRate)}\n• Nettoeinkommen/Jahr: ${money(result.netAnnual)}\n• Pendelzeit/Jahr: ${hours(result.commuteHoursAnnual)}\n• Fahrtkosten/Jahr: ${money(result.commuteCostAnnual)}`;
    navigator.clipboard.writeText(summaryText).then(() => {
      showToast('Ergebnis in die Zwischenablage kopiert!');
    }).catch(() => {
      showToast('Konnte nicht kopiert werden.');
    });
  });

  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.className = 'button button-primary';
  printBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg> Als PDF / Drucken';
  printBtn.addEventListener('click', () => {
    window.print();
  });

  actionWrap.append(copyBtn, printBtn);
  elements.resultsPlaceholder.append(actionWrap);

  elements.resultsPlaceholder.setAttribute('aria-live', 'polite');
  elements.resultsPlaceholder.setAttribute('aria-label', `Effektiver Netto-Stundenlohn: ${money(result.effectiveHourlyRate)}`);
}

export function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3200);
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
