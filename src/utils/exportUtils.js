import { jsPDF } from 'jspdf';

// ─── Fantasy brand palette ─────────────────────────────────────────────────
const PALETTE = {
  dark: {
    bg:          '#0a0a0a',
    rowEven:     '#0a0a0a',
    rowOdd:      '#111111',
    border:      'rgba(255,255,255,0.18)',
    gridLine:    'rgba(255,255,255,0.14)',
    text:        '#ffffff',
    textMuted:   'rgba(255,255,255,0.45)',
    accent:      '#E52222',
    headerBg:    '#111111',
    monthBg:     '#161616',
    weekend:     'rgba(255,255,255,0.04)',
    footerBg:    '#111111',
    emptyBar:    'rgba(255,255,255,0.10)',
  },
  light: {
    bg:          '#ffffff',
    rowEven:     '#ffffff',
    rowOdd:      '#f8f8f8',
    border:      '#cccccc',
    gridLine:    '#d0d0d0',
    text:        '#111111',
    textMuted:   '#777777',
    accent:      '#E52222',
    headerBg:    '#f0f0f0',
    monthBg:     '#e8e8e8',
    weekend:     'rgba(0,0,0,0.04)',
    footerBg:    '#f0f0f0',
    emptyBar:    'rgba(0,0,0,0.08)',
  },
};

// ─── Layout constants (logical pixels — DPR applied internally) ────────────
const L = {
  topStripe:  4,
  headerH:    56,
  monthH:     26,
  dayH:       22,
  rowH:       34,
  barH:       16,
  labelW:     224,
  dayW:       20,
  footerH:    32,
  pad:        16,
  radius:     3,
};

const FONT  = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const SHIELD = 'M128.992248 24.2154558c0-7.837565-5.278685-17.83768403-17.043423-22.47559798-15.2381769-6.00684349-21.1734328 12.15235358-47.452701 12.15235358s-32.214524-18.15919707-47.4527007-12.15235358c-11.76473803 4.63791395-17.0434233 14.63803298-17.0434233 22.47559798 0 10.2510088 12.8466605 17.4455479 12.8466605 40.8021625 0 23.3569371-12.8466605 30.5514761-12.8466605 40.8024847 0 7.837565 5.27868527 17.838007 17.0434233 22.475598 15.2381767 6.006521 21.1734325-12.152353 47.4527007-12.152353s32.2145241 18.158874 47.452701 12.152353c11.764738-4.637591 17.043423-14.638033 17.043423-22.475598 0-10.2510086-12.84666-17.4455476-12.84666-40.8024847 0-23.3566146 12.84666-30.5511537 12.84666-40.8021625';

// ─── Helpers ───────────────────────────────────────────────────────────────
function parseISO(iso) { return new Date(iso + 'T00:00:00'); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function isWeekend(date) { const d = date.getDay(); return d === 0 || d === 6; }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function trunc(ctx, text, maxW) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function drawShield(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 129, size / 130);
  ctx.fillStyle = '#E52222';
  ctx.fill(new Path2D(SHIELD));
  ctx.restore();
}

function drawBrandingHeader(ctx, canvasW, projectName, theme) {
  const P = PALETTE[theme];
  const y = L.topStripe;

  ctx.fillStyle = P.headerBg;
  ctx.fillRect(0, y, canvasW, L.headerH);

  // Shield logo
  const shieldSz = 26;
  const shieldY  = y + (L.headerH - shieldSz) / 2;
  drawShield(ctx, L.pad, shieldY, shieldSz);

  // "Fantt Chart"
  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = P.text;
  ctx.textAlign = 'left';
  ctx.fillText('Fantt Chart', L.pad + shieldSz + 10, y + L.headerH / 2 + 2);

  // "by Fantasy" under wordmark
  ctx.font = `400 9px ${FONT}`;
  ctx.fillStyle = P.textMuted;
  ctx.fillText('by Fantasy', L.pad + shieldSz + 10, y + L.headerH / 2 + 15);

  // Project name — centered
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = P.text;
  ctx.textAlign = 'center';
  ctx.fillText(projectName || 'Untitled Project', canvasW / 2, y + L.headerH / 2 + 5);

  // Export date — right
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  ctx.font = `400 10px ${FONT}`;
  ctx.fillStyle = P.textMuted;
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, canvasW - L.pad, y + L.headerH / 2 + 5);

  // Bottom border
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + L.headerH);
  ctx.lineTo(canvasW, y + L.headerH);
  ctx.stroke();
}

function drawDateHeaders(ctx, canvasW, chartStart, totalDays, theme) {
  const P = PALETTE[theme];
  const monthY = L.topStripe + L.headerH;
  const dayY   = monthY + L.monthH;

  // Month row background
  ctx.fillStyle = P.monthBg;
  ctx.fillRect(L.labelW, monthY, canvasW - L.labelW, L.monthH);
  ctx.fillStyle = P.headerBg;
  ctx.fillRect(0, monthY, L.labelW, L.monthH);

  // Month cells
  let d = 0;
  while (d < totalDays) {
    const date  = addDays(chartStart, d);
    const yr    = date.getFullYear();
    const mo    = date.getMonth();
    let e = d + 1;
    while (e < totalDays) {
      const nd = addDays(chartStart, e);
      if (nd.getFullYear() !== yr || nd.getMonth() !== mo) break;
      e++;
    }
    const mx = L.labelW + d * L.dayW;
    const mw = (e - d) * L.dayW;

    // Border right
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + mw, monthY);
    ctx.lineTo(mx + mw, monthY + L.monthH);
    ctx.stroke();

    // Label
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    ctx.font = `600 10px ${FONT}`;
    ctx.fillStyle = P.text;
    ctx.textAlign = 'center';
    ctx.fillText(label, mx + mw / 2, monthY + L.monthH / 2 + 4);
    d = e;
  }

  // Day row background
  ctx.fillStyle = P.headerBg;
  ctx.fillRect(0, dayY, canvasW, L.dayH);

  const DAY_ABBR = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

  // Every day: abbrev label + date number + grid line
  for (let d = 0; d < totalDays; d++) {
    const date = addDays(chartStart, d);
    const dx   = L.labelW + d * L.dayW;
    const dow  = date.getDay();
    const wknd = dow === 0 || dow === 6;

    // Weekend cell tint
    if (wknd) {
      ctx.fillStyle = P.weekend;
      ctx.fillRect(dx, dayY, L.dayW, L.dayH);
    }

    // Day abbrev (top half of cell)
    ctx.font = `500 7px ${FONT}`;
    ctx.fillStyle = wknd ? P.textMuted : P.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(DAY_ABBR[dow], dx + L.dayW / 2, dayY + 9);

    // Day number (bottom half of cell)
    ctx.font = `600 8px ${FONT}`;
    ctx.fillStyle = wknd ? P.textMuted : P.text;
    ctx.fillText(date.getDate(), dx + L.dayW / 2, dayY + 19);

    // Vertical grid line on every day
    ctx.strokeStyle = P.gridLine;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(dx, dayY);
    ctx.lineTo(dx, dayY + L.dayH);
    ctx.stroke();
  }

  // Header bottom line
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, dayY + L.dayH);
  ctx.lineTo(canvasW, dayY + L.dayH);
  ctx.stroke();
}

function drawTasks(ctx, tasks, canvasW, chartStart, totalDays, tasksY, theme) {
  const P = PALETTE[theme];

  // Today line
  const today     = new Date(); today.setHours(0,0,0,0);
  const todayOff  = daysBetween(chartStart, today);
  const todayX    = L.labelW + todayOff * L.dayW + L.dayW / 2;

  tasks.forEach((task, i) => {
    const rowY = tasksY + i * L.rowH;

    // Row bg
    ctx.fillStyle = i % 2 === 0 ? P.rowEven : P.rowOdd;
    ctx.fillRect(0, rowY, canvasW, L.rowH);

    // Weekend shading in gantt area
    for (let d = 0; d < totalDays; d++) {
      if (isWeekend(addDays(chartStart, d))) {
        ctx.fillStyle = P.weekend;
        ctx.fillRect(L.labelW + d * L.dayW, rowY, L.dayW, L.rowH);
      }
    }

    // Daily grid lines
    for (let d = 0; d < totalDays; d++) {
      const dow = addDays(chartStart, d).getDay();
      ctx.strokeStyle = dow === 1 ? P.border : P.gridLine;
      ctx.lineWidth = dow === 1 ? 0.75 : 0.5;
      ctx.beginPath();
      ctx.moveTo(L.labelW + d * L.dayW, rowY);
      ctx.lineTo(L.labelW + d * L.dayW, rowY + L.rowH);
      ctx.stroke();
    }

    // Task label
    const nameY = task.group
      ? rowY + L.rowH / 2 + 4
      : rowY + L.rowH / 2 + 5;

    if (task.group) {
      ctx.font = `400 8px ${FONT}`;
      ctx.fillStyle = P.textMuted;
      ctx.textAlign = 'left';
      ctx.fillText(trunc(ctx, task.group, L.labelW - L.pad * 2), L.pad, rowY + L.rowH / 2 - 6);
    }
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = P.text;
    ctx.textAlign = 'left';
    ctx.fillText(trunc(ctx, task.name || 'Untitled', L.labelW - L.pad * 2), L.pad, nameY);

    // Row divider
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, rowY + L.rowH);
    ctx.lineTo(canvasW, rowY + L.rowH);
    ctx.stroke();

    // Gantt bar
    const tStart = parseISO(task.start);
    const tEnd   = parseISO(task.end);
    const bStart = daysBetween(chartStart, tStart);
    const bDays  = Math.max(daysBetween(tStart, tEnd) + 1, 1);
    const bX     = L.labelW + bStart * L.dayW;
    const bW     = Math.max(bDays * L.dayW, 4);
    const bY     = rowY + (L.rowH - L.barH) / 2;
    const barClr = task.color || '#E52222';
    const prog   = task.progress || 0;

    // Empty bar track
    roundRect(ctx, bX, bY, bW, L.barH, L.radius);
    ctx.fillStyle = P.emptyBar;
    ctx.fill();

    // Filled progress
    if (prog > 0) {
      const fillW = Math.max((bW * prog) / 100, L.radius * 2);
      roundRect(ctx, bX, bY, fillW, L.barH, L.radius);
      ctx.fillStyle = barClr;
      ctx.fill();
    } else {
      roundRect(ctx, bX, bY, bW, L.barH, L.radius);
      ctx.fillStyle = barClr;
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Progress % label above bar
    if (prog > 0) {
      ctx.font = `600 8px ${FONT}`;
      ctx.fillStyle = P.textMuted;
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(prog)}%`, bX + bW, bY - 2);
    }
  });

  // Today line (over tasks)
  if (todayOff >= 0 && todayOff < totalDays) {
    ctx.strokeStyle = '#E52222';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(todayX, tasksY);
    ctx.lineTo(todayX, tasksY + tasks.length * L.rowH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Label column right border
  ctx.strokeStyle = PALETTE[theme].border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.labelW, L.topStripe + L.headerH + L.monthH + L.dayH);
  ctx.lineTo(L.labelW, tasksY + tasks.length * L.rowH);
  ctx.stroke();
}

function drawFooter(ctx, canvasW, tasks, theme) {
  const P = PALETTE[theme];
  const footerY = L.topStripe + L.headerH + L.monthH + L.dayH + tasks.length * L.rowH;

  ctx.fillStyle = P.footerBg;
  ctx.fillRect(0, footerY, canvasW, L.footerH);
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(canvasW, footerY);
  ctx.stroke();

  ctx.font = `400 9px ${FONT}`;

  ctx.font = `400 9px ${FONT}`;
  ctx.fillStyle = P.textMuted;

  ctx.textAlign = 'center';
  ctx.fillText(`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`, canvasW / 2, footerY + L.footerH / 2 + 4);

  ctx.textAlign = 'right';
  ctx.fillText('fantt.vercel.app', canvasW - L.pad, footerY + L.footerH / 2 + 4);
  ctx.textAlign = 'left';
}

// ─── Main canvas builder ───────────────────────────────────────────────────
export async function buildGanttCanvas(tasks, projectName, theme = 'dark') {
  await document.fonts.ready;

  if (!tasks?.length) return null;

  const starts    = tasks.map(t => parseISO(t.start));
  const ends      = tasks.map(t => parseISO(t.end));
  const rawStart  = new Date(Math.min(...starts));
  const rawEnd    = new Date(Math.max(...ends));
  const chartStart = addDays(rawStart, -2);
  const chartEnd   = addDays(rawEnd, 3);
  const totalDays  = daysBetween(chartStart, chartEnd) + 1;

  const canvasW = L.labelW + totalDays * L.dayW;
  const canvasH = L.topStripe + L.headerH + L.monthH + L.dayH + tasks.length * L.rowH + L.footerH;

  const DPR    = 2;
  const canvas = document.createElement('canvas');
  canvas.width  = canvasW * DPR;
  canvas.height = canvasH * DPR;
  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  const P = PALETTE[theme];

  // Background
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Top red stripe
  ctx.fillStyle = '#E52222';
  ctx.fillRect(0, 0, canvasW, L.topStripe);

  drawBrandingHeader(ctx, canvasW, projectName, theme);
  drawDateHeaders(ctx, canvasW, chartStart, totalDays, theme);

  const tasksY = L.topStripe + L.headerH + L.monthH + L.dayH;
  drawTasks(ctx, tasks, canvasW, chartStart, totalDays, tasksY, theme);
  drawFooter(ctx, canvasW, tasks, theme);

  return canvas;
}

// ─── PNG ──────────────────────────────────────────────────────────────────
export function downloadPNG(canvas, projectName) {
  const link = document.createElement('a');
  link.download = `${projectName || 'Gantt'} - Gantt.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ─── PDF ──────────────────────────────────────────────────────────────────
// A4 landscape in mm
const PDF_W = 297;
const PDF_H = 210;
const PDF_MARGIN = 8;

export async function downloadPDF(tasks, projectName, theme = 'dark', layout = 'fit') {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });

  if (layout === 'fit') {
    const canvas = await buildGanttCanvas(tasks, projectName, theme);
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const ratio   = canvas.width / canvas.height;
    const fitW    = PDF_W - PDF_MARGIN * 2;
    const fitH    = Math.min(PDF_H - PDF_MARGIN * 2, fitW / ratio);
    const fitW2   = fitH * ratio;
    const xOff    = (PDF_W - fitW2) / 2;
    doc.addImage(imgData, 'PNG', xOff, PDF_MARGIN, fitW2, fitH);
  } else {
    // Multi-page: rebuild a canvas for each time slice, repeating task labels
    await document.fonts.ready;
    if (!tasks?.length) return;

    const starts     = tasks.map(t => parseISO(t.start));
    const ends       = tasks.map(t => parseISO(t.end));
    const chartStart = addDays(new Date(Math.min(...starts)), -2);
    const chartEnd   = addDays(new Date(Math.max(...ends)), 3);
    const totalDays  = daysBetween(chartStart, chartEnd) + 1;

    // How many days fit on one page (excluding label column)
    // A4 landscape content width in px at 96dpi
    const pageContentPx = (PDF_W - PDF_MARGIN * 2) * (96 / 25.4);
    const daysPerPage   = Math.floor((pageContentPx - L.labelW) / L.dayW);
    const totalPages    = Math.ceil(totalDays / daysPerPage);

    const DPR = 2;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage('a4', 'landscape');

      const dayOffset = page * daysPerPage;
      const pageDays  = Math.min(daysPerPage, totalDays - dayOffset);
      const pageStart = addDays(chartStart, dayOffset);

      const canvasW = L.labelW + pageDays * L.dayW;
      const canvasH = L.topStripe + L.headerH + L.monthH + L.dayH + tasks.length * L.rowH + L.footerH;

      const canvas  = document.createElement('canvas');
      canvas.width  = canvasW * DPR;
      canvas.height = canvasH * DPR;
      const ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);

      const P = PALETTE[theme];
      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = '#E52222';
      ctx.fillRect(0, 0, canvasW, L.topStripe);

      const pageLabel = totalPages > 1
        ? `${projectName} — Page ${page + 1} of ${totalPages}`
        : projectName;

      drawBrandingHeader(ctx, canvasW, pageLabel, theme);
      drawDateHeaders(ctx, canvasW, pageStart, pageDays, theme);

      const tasksY = L.topStripe + L.headerH + L.monthH + L.dayH;
      drawTasks(ctx, tasks, canvasW, pageStart, pageDays, tasksY, theme);
      drawFooter(ctx, canvasW, tasks, theme);

      const imgData = canvas.toDataURL('image/png');
      const ratio   = canvas.width / canvas.height;
      const fitW    = PDF_W - PDF_MARGIN * 2;
      const fitH    = Math.min(PDF_H - PDF_MARGIN * 2, fitW / ratio);
      const fitW2   = fitH * ratio;
      const xOff    = (PDF_W - fitW2) / 2;
      doc.addImage(imgData, 'PNG', xOff, PDF_MARGIN, fitW2, fitH);
    }
  }

  doc.save(`${projectName || 'Gantt'} - Gantt.pdf`);
}

