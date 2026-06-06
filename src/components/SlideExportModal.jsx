import { useMemo, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { getGroupColor, getAllGroups } from '../utils/colors';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const PAD_X = 80;
const LABEL_W = 260;
const CHART_X = PAD_X + LABEL_W;
const CHART_W = SLIDE_W - CHART_X - PAD_X;
const ACCENT_H = 8;
const TITLE_Y = ACCENT_H + 60;
const DIVIDER_Y = TITLE_Y + 56;
const HEADER_Y = DIVIDER_Y + 16;
const HEADER_H = 40;
const BODY_Y = HEADER_Y + HEADER_H;
const FOOTER_RESERVE = 60;

const BG = '#F8FAFC';
const TEXT_DARK = '#0F172A';
const TEXT_MID = '#475569';
const TEXT_LIGHT = '#94A3B8';
const GRID = '#E2E8F0';
const ACCENT_RED = '#E52222';
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
        const avg = Math.round(rows.reduce((s, t) => s + (t.progress || 0), 0) / rows.length);
        const color = key === '__other__' ? '#64748B' : getGroupColor(key, allGroups);
        return { label: key === '__other__' ? 'Other' : key, start: starts[0], end: ends[ends.length - 1], progress: avg, color };
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [tasks, allGroups]);

  const { rangeStart, totalMs, months, dateLabel } = useMemo(() => {
    if (!epics.length) return { rangeStart: new Date(), totalMs: 86400000, months: [], dateLabel: '' };
    const allS = epics.map(e => new Date(e.start + 'T00:00:00'));
    const allE = epics.map(e => new Date(e.end + 'T00:00:00'));
    const rs = new Date(Math.min(...allS));
    const re = new Date(Math.max(...allE));
    re.setDate(re.getDate() + 1);
    if (re <= rs) re.setMonth(re.getMonth() + 1);
    const tms = re - rs;
    const months = [];
    const cur = new Date(rs.getFullYear(), rs.getMonth(), 1);
    while (cur <= re) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return {
      rangeStart: rs, totalMs: tms, months,
      dateLabel: `${fmt(new Date(epics[0].start + 'T00:00:00'))} – ${fmt(new Date(epics[epics.length - 1].end + 'T00:00:00'))}`,
    };
  }, [epics]);

  const available = SLIDE_H - BODY_Y - FOOTER_RESERVE;
  const ROW_H = Math.min(80, Math.max(44, Math.floor(available / Math.max(epics.length, 1))));
  const BAR_H = Math.round(ROW_H * 0.48);

  function xOf(ms) { return CHART_X + (ms / totalMs) * CHART_W; }
  function xDate(s) { return xOf(new Date(s + 'T00:00:00') - rangeStart); }
  function xObj(d) { return xOf(d - rangeStart); }

  function handleDownload() {
    const el = svgRef.current;
    if (!el) return;
    const clone = el.cloneNode(true);
    clone.setAttribute('width', String(SLIDE_W));
    clone.setAttribute('height', String(SLIDE_H));
    clone.removeAttribute('style');
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

        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text">Slide Preview</h2>
            <p className="text-xs text-text-muted mt-0.5">{epics.length} phase{epics.length !== 1 ? 's' : ''} · 1920×1080 PNG</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 bg-bg-alt">
          <div className="w-full rounded-lg overflow-hidden border border-border shadow" style={{ aspectRatio: '16/9' }}>
            {/* No width/height attrs — viewBox + CSS prevents the browser rendering at 1920px */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background */}
              <rect width={SLIDE_W} height={SLIDE_H} fill={BG} />

              {/* Top accent bar */}
              <rect width={SLIDE_W} height={ACCENT_H} fill={ACCENT_RED} />

              {/* Title */}
              <text x={PAD_X} y={TITLE_Y} dominantBaseline="middle"
                fontSize={36} fontWeight={700} fill={TEXT_DARK} fontFamily={FONT}>
                {projectName}
              </text>
              <text x={SLIDE_W - PAD_X} y={TITLE_Y} dominantBaseline="middle"
                textAnchor="end" fontSize={18} fill={TEXT_LIGHT} fontFamily={FONT}>
                {dateLabel}
              </text>

              {/* Title divider */}
              <line x1={PAD_X} y1={DIVIDER_Y} x2={SLIDE_W - PAD_X} y2={DIVIDER_Y}
                stroke={GRID} strokeWidth={1} />

              {/* Vertical month grid */}
              {months.map((m, i) => {
                const x = xObj(m);
                if (x < CHART_X - 1) return null;
                return <line key={i} x1={x} y1={HEADER_Y} x2={x} y2={BODY_Y + epics.length * ROW_H}
                  stroke={GRID} strokeWidth={1} />;
              })}

              {/* Month labels */}
              {months.map((m, i) => {
                const x = xObj(m);
                if (x < CHART_X - 1) return null;
                const isJan = m.getMonth() === 0;
                const label = isJan
                  ? m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : m.toLocaleDateString('en-US', { month: 'short' });
                return (
                  <text key={i} x={x + 10} y={HEADER_Y + HEADER_H / 2}
                    dominantBaseline="middle" fontSize={14} fill={TEXT_LIGHT} fontFamily={FONT}>
                    {label}
                  </text>
                );
              })}

              {/* Phase rows */}
              {epics.map((epic, i) => {
                const rowY = BODY_Y + i * ROW_H;
                const barY = rowY + (ROW_H - BAR_H) / 2;
                const endD = new Date(epic.end + 'T00:00:00');
                endD.setDate(endD.getDate() + 1);
                const bx = xDate(epic.start);
                const bw = Math.max(xObj(endD) - bx, 6);
                const fillW = bw * epic.progress / 100;

                return (
                  <g key={epic.label}>
                    {/* Row divider (except first) */}
                    {i > 0 && (
                      <line x1={PAD_X} y1={rowY} x2={SLIDE_W - PAD_X} y2={rowY}
                        stroke={GRID} strokeWidth={0.5} />
                    )}

                    {/* Phase label */}
                    <text x={PAD_X + LABEL_W - 20} y={rowY + ROW_H / 2}
                      dominantBaseline="middle" textAnchor="end"
                      fontSize={17} fontWeight={600} fill={TEXT_MID} fontFamily={FONT}>
                      {epic.label}
                    </text>

                    {/* Base bar (unfilled) */}
                    <rect x={bx} y={barY} width={bw} height={BAR_H}
                      rx={BAR_H / 2} ry={BAR_H / 2}
                      fill={epic.color} opacity={0.15} />

                    {/* Progress fill */}
                    {epic.progress > 0 && (
                      <rect x={bx} y={barY} width={fillW} height={BAR_H}
                        rx={BAR_H / 2} ry={BAR_H / 2}
                        fill={epic.color} />
                    )}
                  </g>
                );
              })}

              {/* Bottom rule */}
              <line x1={PAD_X} y1={BODY_Y + epics.length * ROW_H} x2={SLIDE_W - PAD_X} y2={BODY_Y + epics.length * ROW_H}
                stroke={GRID} strokeWidth={1} />

              {/* Footer */}
              <text x={SLIDE_W - PAD_X} y={BODY_Y + epics.length * ROW_H + 32}
                textAnchor="end" fontSize={13} fill={TEXT_LIGHT} fontFamily={FONT}>
                fantt.vercel.app
              </text>
            </svg>
          </div>
        </div>

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
