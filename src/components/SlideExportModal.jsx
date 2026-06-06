import { useMemo, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { getTaskColor, getAllGroups } from '../utils/colors';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const PAD_X = 96;
const LABEL_W = 280;
const CHART_X = PAD_X + LABEL_W;
const CHART_W = SLIDE_W - CHART_X - PAD_X;

// Dark theme — presentation quality
const BG       = '#0D0D0F';
const SURFACE  = '#161618';
const TEXT_HI  = '#FFFFFF';
const TEXT_MID = 'rgba(255,255,255,0.55)';
const TEXT_LO  = 'rgba(255,255,255,0.25)';
const GRID     = 'rgba(255,255,255,0.07)';
const TRACK    = 'rgba(255,255,255,0.09)';
const RED      = '#E52222';
const FONT     = "'Helvetica Neue', Arial, sans-serif";

export default function SlideExportModal({ tasks, projectName, onClose }) {
  const svgRef = useRef(null);

  const slideTasks = useMemo(() => {
    const marked = tasks.filter(t => t.inSlide);
    return marked.length > 0 ? marked : tasks;
  }, [tasks]);

  const allGroups = useMemo(() => getAllGroups(slideTasks), [slideTasks]);

  // Each starred task is its own bar — no phase collapsing
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

  const { rangeStart, totalMs, months, dateLabel, todayX } = useMemo(() => {
    if (!rows.length) return { rangeStart: new Date(), totalMs: 86400000, months: [], dateLabel: '', todayX: null };

    const rs = new Date(Math.min(...rows.map(r => new Date(r.start + 'T00:00:00'))));
    const re = new Date(Math.max(...rows.map(r => new Date(r.end + 'T00:00:00'))));
    re.setDate(re.getDate() + 1);
    if (re <= rs) re.setMonth(re.getMonth() + 1);
    const tms = re - rs;

    const months = [];
    const cur = new Date(rs.getFullYear(), rs.getMonth(), 1);
    while (cur <= re) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }

    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const dateLabel = `${fmt(new Date(rows[0].start + 'T00:00:00'))} – ${fmt(new Date(rows[rows.length - 1].end + 'T00:00:00'))}`;

    const today = new Date();
    const todayMs = today - rs;
    const todayX = (todayMs > 0 && todayMs < tms) ? CHART_X + (todayMs / tms) * CHART_W : null;

    return { rangeStart: rs, totalMs: tms, months, dateLabel, todayX };
  }, [rows]);

  // Layout — vertically center the chart block in the space below the title
  const ACCENT_H   = 6;
  const TITLE_END  = ACCENT_H + 130;  // space for title + date
  const FOOTER_H   = 56;
  const HEADER_H   = 44;
  const ROW_H      = Math.min(96, Math.max(52, Math.floor(
    (SLIDE_H - TITLE_END - FOOTER_H - HEADER_H) / Math.max(rows.length, 1)
  )));
  const CHART_BLOCK_H = HEADER_H + rows.length * ROW_H;
  const AVAIL         = SLIDE_H - TITLE_END - FOOTER_H;
  const CHART_TOP     = TITLE_END + Math.max(16, (AVAIL - CHART_BLOCK_H) / 2);
  const BODY_Y        = CHART_TOP + HEADER_H;
  const BAR_H         = Math.round(ROW_H * 0.42);

  function xOf(ms)  { return CHART_X + (ms / totalMs) * CHART_W; }
  function xDate(s) { return xOf(new Date(s + 'T00:00:00') - rangeStart); }
  function xObj(d)  { return xOf(d - rangeStart); }

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

  const starredCount = tasks.filter(t => t.inSlide).length;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6">
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
          <div className="w-full rounded-lg overflow-hidden border border-border shadow-lg" style={{ aspectRatio: '16/9' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background */}
              <rect width={SLIDE_W} height={SLIDE_H} fill={BG} />

              {/* Top accent stripe */}
              <rect width={SLIDE_W} height={ACCENT_H} fill={RED} />

              {/* Title area background */}
              <rect x={0} y={ACCENT_H} width={SLIDE_W} height={TITLE_END - ACCENT_H} fill={SURFACE} />

              {/* Project name */}
              <text x={PAD_X} y={ACCENT_H + 76} dominantBaseline="middle"
                fontSize={42} fontWeight={800} fill={TEXT_HI} fontFamily={FONT} letterSpacing="-0.5">
                {projectName}
              </text>

              {/* Date range */}
              <text x={SLIDE_W - PAD_X} y={ACCENT_H + 76} dominantBaseline="middle"
                textAnchor="end" fontSize={20} fill={TEXT_MID} fontFamily={FONT}>
                {dateLabel}
              </text>

              {/* Title bottom divider */}
              <line x1={0} y1={TITLE_END} x2={SLIDE_W} y2={TITLE_END} stroke={GRID} strokeWidth={1} />

              {/* Vertical month grid lines */}
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
                  <text key={i} x={x + 12} y={CHART_TOP + HEADER_H / 2}
                    dominantBaseline="middle" fontSize={13} fill={TEXT_LO} fontFamily={FONT} fontWeight={500}>
                    {label.toUpperCase()}
                  </text>
                );
              })}

              {/* Today line */}
              {todayX && (
                <line x1={todayX} y1={CHART_TOP} x2={todayX} y2={BODY_Y + rows.length * ROW_H}
                  stroke={RED} strokeWidth={1.5} opacity={0.6} />
              )}

              {/* Task rows */}
              {rows.map((row, i) => {
                const rowY = BODY_Y + i * ROW_H;
                const barY = rowY + (ROW_H - BAR_H) / 2;
                const endD = new Date(row.end + 'T00:00:00');
                endD.setDate(endD.getDate() + 1);
                const bx  = xDate(row.start);
                const bw  = Math.max(xObj(endD) - bx, 8);
                const fillW = bw * row.progress / 100;
                const r = BAR_H / 2;

                return (
                  <g key={`${row.label}-${i}`}>
                    {/* Subtle row divider */}
                    {i > 0 && (
                      <line x1={PAD_X} y1={rowY} x2={SLIDE_W - PAD_X} y2={rowY}
                        stroke={GRID} strokeWidth={0.5} />
                    )}

                    {/* Task label */}
                    <text x={PAD_X + LABEL_W - 24} y={rowY + ROW_H / 2}
                      dominantBaseline="middle" textAnchor="end"
                      fontSize={16} fontWeight={500} fill={TEXT_MID} fontFamily={FONT}>
                      {row.label}
                    </text>

                    {/* Track (unfilled) */}
                    <rect x={bx} y={barY} width={bw} height={BAR_H}
                      rx={r} ry={r} fill={TRACK} />

                    {/* Progress fill */}
                    {row.progress > 0 && (
                      <rect x={bx} y={barY} width={fillW} height={BAR_H}
                        rx={r} ry={r} fill={row.color} />
                    )}

                    {/* Color dot on label side */}
                    <circle cx={PAD_X + LABEL_W - 10} cy={rowY + ROW_H / 2} r={4} fill={row.color} />
                  </g>
                );
              })}

              {/* Chart bottom rule */}
              <line x1={PAD_X} y1={BODY_Y + rows.length * ROW_H}
                x2={SLIDE_W - PAD_X} y2={BODY_Y + rows.length * ROW_H}
                stroke={GRID} strokeWidth={1} />

              {/* Footer */}
              <text x={SLIDE_W - PAD_X}
                y={SLIDE_H - FOOTER_H / 2}
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
