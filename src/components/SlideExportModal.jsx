import { useMemo, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { getTaskColor, getAllGroups } from '../utils/colors';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const PAD_X   = 112;
const LABEL_W = 300;
const CHART_X = PAD_X + LABEL_W;
const CHART_W = SLIDE_W - CHART_X - PAD_X;

const BG      = '#0C0C0E';
const SURFACE = '#131315';
const TEXT_HI = '#FFFFFF';
const TEXT_LO = 'rgba(255,255,255,0.22)';
const GRID    = 'rgba(255,255,255,0.06)';
const RED     = '#E52222';
const FONT    = "'Helvetica Neue', Arial, sans-serif";

function lighten(hex, amt = 50) {
  const h = hex.replace('#', '');
  const r = Math.min(255, parseInt(h.slice(0, 2), 16) + amt);
  const g = Math.min(255, parseInt(h.slice(2, 4), 16) + amt);
  const b = Math.min(255, parseInt(h.slice(4, 6), 16) + amt);
  return `rgb(${r},${g},${b})`;
}

export default function SlideExportModal({ tasks, projectName, onClose }) {
  const svgRef = useRef(null);

  const slideTasks = useMemo(() => {
    const marked = tasks.filter(t => t.inSlide);
    return marked.length > 0 ? marked : tasks;
  }, [tasks]);

  const allGroups = useMemo(() => getAllGroups(slideTasks), [slideTasks]);

  const rows = useMemo(() =>
    slideTasks
      .map(t => ({
        label: t.name,
        start: t.start,
        end: t.end,
        progress: t.progress || 0,
        color: getTaskColor(t, allGroups),
      }))
      .sort((a, b) => a.start.localeCompare(b.start)),
  [slideTasks, allGroups]);

  const { rangeStart, totalMs, months, dateLabel, todayMs } = useMemo(() => {
    if (!rows.length) return { rangeStart: new Date(), totalMs: 86400000, months: [], dateLabel: '', todayMs: null };
    const rs = new Date(Math.min(...rows.map(r => new Date(r.start + 'T00:00:00'))));
    const re = new Date(Math.max(...rows.map(r => new Date(r.end   + 'T00:00:00'))));
    re.setDate(re.getDate() + 1);
    if (re <= rs) re.setMonth(re.getMonth() + 1);
    const tms = re - rs;
    const months = [];
    const cur = new Date(rs.getFullYear(), rs.getMonth(), 1);
    while (cur <= re) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const dateLabel = `${fmt(new Date(rows[0].start + 'T00:00:00'))} – ${fmt(new Date(rows[rows.length - 1].end + 'T00:00:00'))}`;
    const tm = new Date() - rs;
    return { rangeStart: rs, totalMs: tms, months, dateLabel, todayMs: (tm > 0 && tm < tms) ? tm : null };
  }, [rows]);

  const ACCENT_H    = 6;
  const TITLE_END   = ACCENT_H + 136;
  const FOOTER_H    = 60;
  const HEADER_H    = 48;
  const ROW_H       = Math.min(100, Math.max(56, Math.floor(
    (SLIDE_H - TITLE_END - FOOTER_H - HEADER_H) / Math.max(rows.length, 1)
  )));
  const BAR_H       = Math.round(ROW_H * 0.46);
  const BLOCK_H     = HEADER_H + rows.length * ROW_H;
  const AVAIL       = SLIDE_H - TITLE_END - FOOTER_H;
  const CHART_TOP   = TITLE_END + Math.max(20, (AVAIL - BLOCK_H) / 2);
  const BODY_Y      = CHART_TOP + HEADER_H;
  const r           = BAR_H / 2;

  const xOf   = ms  => CHART_X + (ms / totalMs) * CHART_W;
  const xDate = s   => xOf(new Date(s + 'T00:00:00') - rangeStart);
  const xObj  = d   => xOf(d - rangeStart);

  function handleDownload() {
    const el = svgRef.current;
    if (!el) return;
    const clone = el.cloneNode(true);
    clone.setAttribute('width',  String(SLIDE_W));
    clone.setAttribute('height', String(SLIDE_H));
    clone.removeAttribute('style');
    const xml  = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = SLIDE_W;
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

  const starredCount = tasks.filter(t => t.inSlide).length;

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-6">
      <div className="bg-sidebar border border-border rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text">Slide Preview</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {starredCount > 0 ? `${starredCount} starred task${starredCount !== 1 ? 's' : ''}` : `All ${tasks.length} tasks`} · 1920×1080 PNG
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 bg-bg-alt">
          <div className="w-full rounded-lg overflow-hidden border border-border shadow-xl" style={{ aspectRatio: '16/9' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Per-bar gradient: top highlight → solid color */}
                {rows.map((row, i) => (
                  <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={lighten(row.color, 55)} />
                    <stop offset="100%" stopColor={row.color} />
                  </linearGradient>
                ))}
                {/* Subtle vignette */}
                <radialGradient id="vig" cx="50%" cy="50%" r="70%">
                  <stop offset="0%"   stopColor={BG}      stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000"  stopOpacity="0.45" />
                </radialGradient>
              </defs>

              {/* Background */}
              <rect width={SLIDE_W} height={SLIDE_H} fill={BG} />
              <rect width={SLIDE_W} height={SLIDE_H} fill="url(#vig)" />

              {/* Title surface */}
              <rect x={0} y={ACCENT_H} width={SLIDE_W} height={TITLE_END - ACCENT_H} fill={SURFACE} />

              {/* Red accent stripe */}
              <rect width={SLIDE_W} height={ACCENT_H} fill={RED} />

              {/* Project name */}
              <text x={PAD_X} y={ACCENT_H + 78}
                dominantBaseline="middle" fontSize={48} fontWeight={800}
                fill={TEXT_HI} fontFamily={FONT} letterSpacing="-1">
                {projectName}
              </text>

              {/* Date range */}
              <text x={SLIDE_W - PAD_X} y={ACCENT_H + 78}
                dominantBaseline="middle" textAnchor="end"
                fontSize={19} fill="rgba(255,255,255,0.4)" fontFamily={FONT}>
                {dateLabel}
              </text>

              {/* Title bottom rule */}
              <line x1={0} y1={TITLE_END} x2={SLIDE_W} y2={TITLE_END} stroke={GRID} strokeWidth={1} />

              {/* Month grid lines */}
              {months.map((m, i) => {
                const x = xObj(m);
                if (x < CHART_X) return null;
                return <line key={i} x1={x} y1={CHART_TOP} x2={x} y2={BODY_Y + rows.length * ROW_H}
                  stroke={GRID} strokeWidth={1} />;
              })}

              {/* Month labels */}
              {months.map((m, i) => {
                const x = xObj(m);
                if (x < CHART_X) return null;
                const label = m.getMonth() === 0
                  ? m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : m.toLocaleDateString('en-US', { month: 'short' });
                return (
                  <text key={i} x={x + 14} y={CHART_TOP + HEADER_H / 2}
                    dominantBaseline="middle" fontSize={12} fontWeight={600}
                    fill={TEXT_LO} fontFamily={FONT} letterSpacing="1">
                    {label.toUpperCase()}
                  </text>
                );
              })}

              {/* Today line */}
              {todayMs && (
                <line x1={xOf(todayMs)} y1={CHART_TOP} x2={xOf(todayMs)} y2={BODY_Y + rows.length * ROW_H}
                  stroke={RED} strokeWidth={1.5} opacity={0.5} />
              )}

              {/* Task rows */}
              {rows.map((row, i) => {
                const rowY  = BODY_Y + i * ROW_H;
                const barY  = rowY + (ROW_H - BAR_H) / 2;
                const endD  = new Date(row.end + 'T00:00:00');
                endD.setDate(endD.getDate() + 1);
                const bx    = xDate(row.start);
                const bw    = Math.max(xObj(endD) - bx, 10);
                const fillW = bw * row.progress / 100;

                return (
                  <g key={`${row.label}-${i}`}>
                    {i > 0 && (
                      <line x1={PAD_X} y1={rowY} x2={SLIDE_W - PAD_X} y2={rowY}
                        stroke={GRID} strokeWidth={0.5} />
                    )}

                    {/* Subtle row color wash in chart area */}
                    <rect x={CHART_X} y={rowY} width={CHART_W} height={ROW_H}
                      fill={row.color} opacity={0.03} />

                    {/* Task label — colored */}
                    <text x={PAD_X + LABEL_W - 28} y={rowY + ROW_H / 2}
                      dominantBaseline="middle" textAnchor="end"
                      fontSize={17} fontWeight={600} fill={row.color} fontFamily={FONT}>
                      {row.label}
                    </text>

                    {/* Bar track — color at low opacity */}
                    <rect x={bx} y={barY} width={bw} height={BAR_H}
                      rx={r} ry={r} fill={row.color} opacity={0.12} />

                    {/* Progress fill — gradient */}
                    {row.progress > 0 && (
                      <rect x={bx} y={barY} width={fillW} height={BAR_H}
                        rx={r} ry={r} fill={`url(#bg${i})`} />
                    )}

                    {/* If 0% progress, show solid dim bar so row isn't invisible */}
                    {row.progress === 0 && bw > 10 && (
                      <rect x={bx} y={barY + BAR_H * 0.38} width={bw} height={BAR_H * 0.24}
                        rx={2} ry={2} fill={row.color} opacity={0.25} />
                    )}
                  </g>
                );
              })}

              {/* Bottom rule */}
              <line x1={PAD_X} y1={BODY_Y + rows.length * ROW_H}
                x2={SLIDE_W - PAD_X} y2={BODY_Y + rows.length * ROW_H}
                stroke={GRID} strokeWidth={1} />

              {/* Footer */}
              <text x={SLIDE_W - PAD_X} y={SLIDE_H - FOOTER_H / 2}
                dominantBaseline="middle" textAnchor="end"
                fontSize={13} fill={TEXT_LO} fontFamily={FONT}>
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
