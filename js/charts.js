/** Chart.js bleibt lokal gekapselt; die HTML-Zusammenfassungen funktionieren auch ohne CDN. */
const chartInstances = new Map();
const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const chartColors = ['#4f46e5', '#f97316', '#0f766e', '#16a34a'];

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function createChartBlock(container, id, title, description, summary, type, labels, values, colors) {
  const block = document.createElement('article');
  block.className = 'chart-card';
  const heading = document.createElement('h3'); heading.className = 'chart-title'; heading.textContent = title;
  const desc = document.createElement('p'); desc.className = 'chart-description'; desc.textContent = description;
  const text = document.createElement('p'); text.className = 'chart-summary'; text.textContent = summary;
  const canvasWrap = document.createElement('div'); canvasWrap.className = 'chart-canvas-wrap';
  const canvas = document.createElement('canvas'); canvas.id = id; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', title);
  canvasWrap.append(canvas); block.append(heading, desc, canvasWrap, text); container.append(block);
  if (!window.Chart) return;
  const formatter = (context) => type === 'bar' ? euro.format(context.parsed.y) : `${context.label}: ${euro.format(context.parsed)}`;
  const config = {
    type,
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: prefersReducedMotion() ? false : { duration: 250 },
      plugins: {
        legend: { display: type !== 'bar', position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: formatter } }
      }
    }
  };
  chartInstances.set(id, new window.Chart(canvas, config));
}

export function renderCharts(data, container) {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances.clear();
  if (!container) return;
  container.replaceChildren();
  if (!data) return;
  const grid = document.createElement('div');
  grid.className = 'charts-grid';
  container.append(grid);
  createChartBlock(grid, 'salary-chart', 'Gehaltsaufteilung', 'Jahreswerte des Bruttoeinkommens.', `Von ${euro.format(data.grossAnnual)} bleiben ${euro.format(data.netAnnual)} netto.`, 'doughnut', ['Netto', 'Steuern', 'Sozialabgaben', 'Sonstige Abzüge'], [data.netAnnual, data.taxAnnual, data.socialAnnual, data.otherAnnual], chartColors);
  createChartBlock(grid, 'time-chart', 'Zeitaufwand pro Jahr', 'Arbeitszeit, unbezahlte Pausen und Pendelzeit.', `${number.format(data.paidHoursAnnual)} Stunden bezahlte Arbeit, ${number.format(data.unpaidBreakHoursAnnual)} Stunden Pause und ${number.format(data.commuteHoursAnnual)} Stunden Pendeln.`, 'doughnut', ['Bezahlte Arbeitszeit', 'Unbezahlte Pause', 'Pendelzeit'], [data.paidHoursAnnual, data.unpaidBreakHoursAnnual, data.commuteHoursAnnual], ['#16a34a', '#f59e0b', '#4f46e5']);
  createChartBlock(grid, 'hourly-chart', 'Stundenlohn-Vergleich', 'Klassischer und effektiver Netto-Stundenlohn.', `Der effektive Wert beträgt ${euro.format(data.effectiveHourlyRate)} statt ${euro.format(data.classicNetHourlyRate)} ohne Pendelzeit.`, 'bar', ['Klassisch', 'Effektiv'], [data.classicNetHourlyRate, data.effectiveHourlyRate], ['#0f766e', '#4f46e5']);
}

export function clearCharts(container) {
  chartInstances.forEach((chart) => chart.destroy()); chartInstances.clear();
  if (container) container.replaceChildren();
}

