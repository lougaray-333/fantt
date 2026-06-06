import { useMemo, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { getGroupColor, getContrastColor, getAllGroups } from '../utils/colors';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const LABEL_W = 240;
const CHART_X = LABEL_W;
const CHART_W = SLIDE_W - LABEL_W - 40;
const TITLE_H = 80;
const HEADER_H = 52;
const FOOTER_H = 40;
const BODY_Y = TITLE_H + HEADER_H;

const BG = '#ffffff';
const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6b7280';
const GRID_COLOR = '#e5e7eb';
const FONT = "'Helvetica Neue', Arial, sans-serif";

export default function SlideExportModal({ tasks, projectName, onClose }) {
  const svgRef = useRef(null);

  const allGroups = useMemo(() => getAllGroups(tasks), [tasks]);

  const epics = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      const key = t.group || '__other__';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });

    return [...map.entries()]
      .map(([key, rows]) => {
        const starts = rows.map(t => t.start).sort();
        const ends = rows.map(t => t.end).sort();
        const avgProgress = Math.round(
          rows.reduce((s, t) => s + (t.progress || 0), 0) / rows.length
        );
        const color = key === '__other__' ? '#6b7280' : getGroupColor(key, allGroups);
        return {
          label: key === '__other__' ? 'Other' : key,
          start: starts[0],
          end: ends[ends.length - 1],
          progress: avgProgress,
          color,
          contrastColor: getContrastColor(color),
        };
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [tasks, allGroups]);

  const ROW_H = useMemo(() => {
    const available = SLIDE_H - BODY_Y - FOOTER_H;
    return Math.min(70, Math.max(36, Math.floor(available / Math.max(epics.length, 1))));
  }, [epics.length]);

  const BAR_H = Math.min(38, ROW_H - 16);

  const { rangeStart, totalMs, months, dateRangeLabel } = useMemo(() => {
    if (epics.length === 0) {
      return { rangeStart: new Date(), totalMs: 1, months: [], dateRangeLabel: '' };
    }

    const allStarts = epics.map(e => new Date(e.start + 'T00:00:00'));
    const allEnds = epics.map(e => new Date(e.end + 'T00:00:00'));
    const rs = new Date(Math.min(...allStarts));
    const re = new Date(Math.max(...allEnds));
    re.setDate(re.getDate() + 1);

    // Ensure at least 1 month range
    if (re <= rs) re.setMonth(re.getMonth() + 1);

    const tms = re - rs;

    const months = [];
    const cur = new Date(rs.getFullYear(), rs.getMonth(), 1);
    while (cur <= re) {
      months.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }

    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const label = `${fmt(new Date(epics[0].start + 'T00:00:00'))} – ${fmt(new Date(epics[epics.length - 1].end + 'T00:00:00'))}`;

    return { rangeStart: rs, totalMs: tms, months, dateRangeLabel: label };
  }, [epics]);

  function xFromMs(ms) {
    return CHART_X + (ms / totalMs) * CHART_W;
  }

  function xFromDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return xFromMs(d - rangeStart);
  }

  function xFromDateObj(d) {
    return xFromMs(d - rangeStart);
  }

  function handleDownload() {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('width', SLIDE_W);
    clone.setAttribute('height', SLIDE_H);
    clone.style.width = '';
    clone.style.height = '';
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SLIDE_W;
      canvas.height = SLIDE_H;
      canvas.getContext('2d').drawImage(img, 0, 0, SLIDE_W, SLIDE_H);
      const a = document.createElement('a');
      a.download = `${(projectName || 'project').replace(/\s+/g, '-').toLowerCase()}-schedule.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6">
      <div className="bg-sidebar border border-border rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text">Keynote Slide Preview</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {epics.length} phase{epics.length !== 1 ? 's' : ''} · 1920×1080 PNG
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition">
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="p-5 bg-bg-alt">
          <div
            className="w-full rounded-lg overflow-hidden border border-border shadow-sm"
            style={{ aspectRatio: '16/9' }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
              width={SLIDE_W}
              height={SLIDE_H}
              style={{ width: '100%', height: '100%', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background */}
              <rect width={SLIDE_W} height={SLIDE_H} fill={BG} />

              {/* Vertical month grid lines */}
              {months.map((m, i) => {
                const x = xFromDateObj(m);
                return (
                  <line key={i} x1={x} y1={TITLE_H} x2={x} y2={SLIDE_H - FOOTER_H}
                    stroke={GRID_COLOR} strokeWidth={1} />
                );
              })}

              {/* Alternating row backgrounds */}
              {epics.map((_, i) =>
                i % 2 === 1 ? (
                  <rect key={i} x={0} y={BODY_Y + i * ROW_H} width={SLIDE_W} height={ROW_H}
                    fill="#f9fafb" />
                ) : null
              )}

              {/* Title bar */}
              <rect width={SLIDE_W} height={TITLE_H} fill={BG} />
              <rect width={6} height={TITLE_H} fill="#E52222" />
              <text x={24} y={TITLE_H / 2 + 2} dominantBaseline="middle"
                fontSize={28} fontWeight={700} fill={TEXT_PRIMARY} fontFamily={FONT}>
                {projectName}
              </text>
              <text x={SLIDE_W - 32} y={TITLE_H / 2 + 2} dominantBaseline="middle"
                textAnchor="end" fontSize={16} fill={TEXT_MUTED} fontFamily={FONT}>
                {dateRangeLabel}
              </text>
              <line x1={0} y1={TITLE_H} x2={SLIDE_W} y2={TITLE_H} stroke={GRID_COLOR} strokeWidth={1} />

              {/* Month labels */}
              {months.map((m, i) => {
                const x = xFromDateObj(m);
                return (
                  <text key={i} x={x + 8} y={TITLE_H + HEADER_H / 2 + 1}
                    dominantBaseline="middle" fontSize={13} fill={TEXT_MUTED} fontFamily={FONT}>
                    {m.toLocaleDateString('en-US', { month: 'short', year: "'YY" })}
                  </text>
                );
              })}
              <line x1={CHART_X} y1={TITLE_H + HEADER_H} x2={SLIDE_W} y2={TITLE_H + HEADER_H}
                stroke={GRID_COLOR} strokeWidth={1} />

              {/* Bars */}
              {epics.map((epic, i) => {
                const rowY = BODY_Y + i * ROW_H;
                const barY = rowY + (ROW_H - BAR_H) / 2;
                const endPlus1 = new Date(epic.end + 'T00:00:00');
                endPlus1.setDate(endPlus1.getDate() + 1);
                const barX = xFromDate(epic.start);
                const barEndX = xFromDateObj(endPlus1);
                const barW = Math.max(barEndX - barX, 4);
                const fillW = barW * epic.progress / 100;

                return (
                  <g key={epic.label}>
                    {/* Row label */}
                    <text x={LABEL_W - 16} y={rowY + ROW_H / 2 + 1}
                      dominantBaseline="middle" textAnchor="end"
                      fontSize={15} fontWeight={500} fill={TEXT_PRIMARY} fontFamily={FONT}>
                      {epic.label}
                    </text>

                    {/* Base bar */}
                    <rect x={barX} y={barY} width={barW} height={BAR_H}
                      rx={4} ry={4} fill={epic.color} opacity={0.2} />

                    {/* Progress fill */}
                    {epic.progress > 0 && (
                      <rect x={barX} y={barY} width={fillW} height={BAR_H}
                        rx={4} ry={4} fill={epic.color} />
                    )}

                    {/* Progress % label */}
                    {barW > 60 && (
                      <text
                        x={barX + barW / 2} y={barY + BAR_H / 2 + 1}
                        dominantBaseline="middle" textAnchor="middle"
                        fontSize={13} fontWeight={600} fontFamily={FONT}
                        fill={epic.progress > 50 ? epic.contrastColor : epic.color}
                      >
                        {epic.progress}%
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Label / chart divider */}
              <line x1={CHART_X} y1={TITLE_H} x2={CHART_X} y2={SLIDE_H - FOOTER_H}
                stroke={GRID_COLOR} strokeWidth={1} />

              {/* Footer */}
              <rect x={0} y={SLIDE_H - FOOTER_H} width={SLIDE_W} height={FOOTER_H} fill="#f9fafb" />
              <line x1={0} y1={SLIDE_H - FOOTER_H} x2={SLIDE_W} y2={SLIDE_H - FOOTER_H}
                stroke={GRID_COLOR} strokeWidth={1} />
              <text x={SLIDE_W / 2} y={SLIDE_H - FOOTER_H / 2 + 1}
                dominantBaseline="middle" textAnchor="middle"
                fontSize={12} fill={TEXT_MUTED} fontFamily={FONT}>
                fantt.vercel.app
              </text>
            </svg>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-muted hover:bg-bg-alt transition">
            Cancel
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition">
            <Download size={13} />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
