// Chart.js wrappers bound to server data. Charts are created once and updated in place.
import Chart from "chart.js/auto";

export function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888"; }
export const PALETTE = () => [cssVar("--chrome"), cssVar("--heat"), cssVar("--gas"), cssVar("--power"), cssVar("--slag"), cssVar("--alarm"), cssVar("--ok"), cssVar("--heat-2"), "#8fb3a4", "#d9c88f"];

const live = new Set();
export function destroyAll() { live.forEach((c) => c.destroy()); live.clear(); }

function base(yTitle, xTitle, extra = {}) {
  const ink = cssVar("--ink-2"), line = cssVar("--line");
  return {
    responsive: true, maintainAspectRatio: false, animation: false, parsing: false, normalized: true,
    interaction: { mode: "nearest", intersect: false },
    plugins: { legend: { labels: { color: ink, boxWidth: 10, font: { size: 11 } } }, tooltip: { enabled: true } },
    scales: {
      x: { type: "linear", title: { display: !!xTitle, text: xTitle, color: ink }, ticks: { color: ink, maxTicksLimit: 8 }, grid: { color: line + "55" } },
      y: { title: { display: !!yTitle, text: yTitle, color: ink }, ticks: { color: ink }, grid: { color: line + "55" } },
    }, ...extra,
  };
}

/** Line chart over x (number) with named series. data: {x:[], series:{name:[...]}} */
export function lineChart(canvas, { yTitle, xTitle = "time (h)", colors, dashed = [], y2 = null, stepped = false } = {}) {
  const opts = base(yTitle, xTitle);
  if (y2) opts.scales.y2 = { position: "right", title: { display: true, text: y2, color: cssVar("--ink-2") }, ticks: { color: cssVar("--ink-2") }, grid: { display: false } };
  const ch = new Chart(canvas, { type: "line", data: { datasets: [] }, options: opts });
  live.add(ch);
  return {
    chart: ch,
    update(x, series, axisOf = {}) {
      const pal = colors || PALETTE();
      const names = Object.keys(series);
      ch.data.datasets = names.map((n, i) => ({
        label: n, data: x.map((xx, j) => ({ x: xx, y: series[n][j] })).filter((p) => p.y !== null && p.y !== undefined && Number.isFinite(p.y)),
        borderColor: pal[i % pal.length], backgroundColor: pal[i % pal.length] + "33", pointRadius: 0, borderWidth: 1.6, stepped,
        borderDash: dashed.includes(n) ? [5, 4] : undefined, yAxisID: axisOf[n] || "y", spanGaps: true,
      }));
      ch.update("none");
    },
  };
}

export function barChart(canvas, { yTitle, horizontal = false, stacked = false, colors } = {}) {
  const opts = base(yTitle, null);
  opts.parsing = true; opts.normalized = false;
  opts.scales.x = { type: "category", ticks: { color: cssVar("--ink-2"), autoSkip: false, maxRotation: 50 }, grid: { display: false }, stacked };
  opts.scales.y.stacked = stacked;
  if (horizontal) { opts.indexAxis = "y"; [opts.scales.x, opts.scales.y] = [{ ...opts.scales.y, type: "linear" }, { ...opts.scales.x }]; }
  const ch = new Chart(canvas, { type: "bar", data: { labels: [], datasets: [] }, options: opts });
  live.add(ch);
  return {
    chart: ch,
    update(labels, series) {
      const pal = colors || PALETTE();
      ch.data.labels = labels;
      ch.data.datasets = Object.entries(series).map(([n, v], i) => ({ label: n, data: v, backgroundColor: (Array.isArray(colors?.[0]) ? colors[i] : pal[i % pal.length]) + "cc", borderWidth: 0 }));
      ch.update("none");
    },
  };
}

export function scatterChart(canvas, { xTitle, yTitle } = {}) {
  const ch = new Chart(canvas, { type: "scatter", data: { datasets: [] }, options: base(yTitle, xTitle) });
  live.add(ch);
  return { chart: ch, update(sets) { const pal = PALETTE(); ch.data.datasets = Object.entries(sets).map(([n, pts], i) => ({ label: n, data: pts, backgroundColor: pal[i % pal.length], pointRadius: 3.5 })); ch.update("none"); } };
}

export function doughnut(canvas) {
  const ch = new Chart(canvas, { type: "doughnut", data: { labels: [], datasets: [] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: "right", labels: { color: cssVar("--ink-2"), boxWidth: 10, font: { size: 11 } } } } } });
  live.add(ch);
  return { chart: ch, update(labels, values) { const pal = PALETTE(); ch.data.labels = labels; ch.data.datasets = [{ data: values, backgroundColor: labels.map((_, i) => pal[i % pal.length]), borderWidth: 0 }]; ch.update("none"); } };
}
