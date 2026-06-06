import { useMemo, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import { getTaskColor, getAllGroups } from '../utils/colors';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const PAD_X   = 88;
const LABEL_W = 280;
const CHART_X = PAD_X + LABEL_W;
const CHART_W = SLIDE_W - CHART_X - PAD_X;
const RED     = '#E52222';
const FONT    = "'Helvetica Neue', Arial, sans-serif";

const THEMES = {
  dark: {
    bg:      '#0A0A0A',
    surface: '#0F0F0F',
    border:  'rgba(255,255,255,0.08)',
    textHi:  '#FFFFFF',
    textMid: '#E8E8E8',           // near-white — passes WCAG AA
    textLo:  'rgba(255,255,255,0.50)',
    grid:    'rgba(255,255,255,0.07)',
    gridMaj: 'rgba(255,255,255,0.14)',
    track:   'rgba(229,34,34,0.20)',
    fill:    RED,
    today:   'rgba(255,255,255,0.5)',
  },
  light: {
    bg:      '#F8F8F7',
    surface: '#ECECEA',
    border:  'rgba(0,0,0,0.10)',
    textHi:  '#0A0A0A',
    textMid: '#1C1C1C',           // near-black — passes WCAG AA
    textLo:  'rgba(0,0,0,0.48)',
    grid:    'rgba(0,0,0,0.07)',
    gridMaj: 'rgba(0,0,0,0.15)',
    track:   'rgba(229,34,34,0.14)',
    fill:    RED,
    today:   'rgba(0,0,0,0.4)',
  },
};

export default function SlideExportModal({ tasks, projectName, onClose }) {
  const svgRef = useRef(null);
  const [theme, setTheme] = useState('dark');
  const T = THEMES[theme];

  const slideTasks = useMemo(() => {
    const marked = tasks.filter(t => t.inSlide);
    return marked.length > 0 ? marked : tasks;
  }, [tasks]);

  const allGroups = useMemo(() => getAllGroups(slideTasks), [slideTasks]);

  const rows = useMemo(() =>
    slideTasks
      .map(t => ({ label: t.name, start: t.start, end: t.end, progress: t.progress || 0 }))
      .sort((a, b) => a.start.localeCompare(b.start)),
  [slideTasks, allGroups]);

  const { rangeStart, totalMs, weeks, dateLabel, todayMs } = useMemo(() => {
    if (!rows.length) return { rangeStart: new Date(), totalMs: 86400000, weeks: [], dateLabel: '', todayMs: null };

    const rs = new Date(Math.min(...rows.map(r => new Date(r.start + 'T00:00:00'))));
    const re = new Date(Math.max(...rows.map(r => new Date(r.end   + 'T00:00:00'))));
    re.setDate(re.getDate() + 1);
    if (re <= rs) re.setMonth(re.getMonth() + 1);
    const tms = re - rs;

    // Snap to Monday of the week containing rangeStart
    const weekAnchor = new Date(rs);
    const dow = weekAnchor.getDay();
    weekAnchor.setDate(weekAnchor.getDate() - (dow === 0 ? 6 : dow - 1));

    // Build week ticks
    const weeks = [];
    const cur = new Date(weekAnchor);
    while (cur <= re) {
      weeks.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }

    // Adaptive label frequency: show label every N weeks to avoid crowding
    const pxPerWeek = CHART_W / weeks.length;
    const labelEvery = pxPerWeek < 56 ? 4 : pxPerWeek < 100 ? 2 : 1;

    // Annotate which weeks get a label
    weeks.forEach((w, i) => {
      w._label = i % labelEvery === 0;
      w._major = w.getDate() <= 7; // first week of a month → major grid line
    });

    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const tm = new Date() - rs;
    return {
      rangeStart: rs, totalMs: tms, weeks,
      dateLabel: `${fmt(new Date(rows[0].start + 'T00:00:00'))} – ${fmt(new Date(rows[rows.length-1].end + 'T00:00:00'))}`,
      todayMs: (tm > 0 && tm < tms) ? tm : null,
    };
  }, [rows]);

  const ACCENT_H   = 10;
  const TITLE_END  = ACCENT_H + 154;
  const FOOTER_H   = 52;
  const HEADER_H   = 48;
  const AVAIL_ROWS = SLIDE_H - TITLE_END - FOOTER_H - HEADER_H;
  const ROW_H      = Math.min(160, Math.max(72, Math.floor(AVAIL_ROWS / Math.max(rows.length, 1))));
  const BAR_H      = Math.round(ROW_H * 0.52);
  const BLOCK_H    = HEADER_H + rows.length * ROW_H;
  const AVAIL      = SLIDE_H - TITLE_END - FOOTER_H;
  const CHART_TOP  = TITLE_END + Math.max(20, (AVAIL - BLOCK_H) / 2);
  const BODY_Y     = CHART_TOP + HEADER_H;
  const br         = BAR_H / 2;

  const xOf   = ms => CHART_X + (ms / totalMs) * CHART_W;
  const xDate = s  => xOf(new Date(s + 'T00:00:00') - rangeStart);
  const xObj  = d  => xOf(d - rangeStart);

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
      a.download = `${(projectName || 'project').replace(/\s+/g, '-').toLowerCase()}-schedule-${theme}.png`;
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
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
              {['dark', 'light'].map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`px-3 py-1.5 transition capitalize ${
                    theme === t ? 'bg-accent text-white' : 'text-text-muted hover:bg-bg-alt'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 bg-bg-alt">
          <div className="w-full rounded-lg overflow-hidden border border-border shadow-xl" style={{ aspectRatio: '16/9' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background */}
              <rect width={SLIDE_W} height={SLIDE_H} fill={T.bg} />

              {/* Title surface */}
              <rect x={0} y={ACCENT_H} width={SLIDE_W} height={TITLE_END - ACCENT_H} fill={T.surface} />

              {/* Red accent stripe */}
              <rect width={SLIDE_W} height={ACCENT_H} fill={RED} />

              {/* Project name */}
              <text x={PAD_X} y={ACCENT_H + 87}
                dominantBaseline="middle" fontSize={68} fontWeight={800}
                fill={T.textHi} fontFamily={FONT}>
                {projectName}
              </text>

              {/* Date range */}
              <text x={SLIDE_W - PAD_X} y={ACCENT_H + 87}
                dominantBaseline="middle" textAnchor="end"
                fontSize={22} fill={T.textLo} fontFamily={FONT}>
                {dateLabel}
              </text>

              {/* Title divider */}
              <line x1={0} y1={TITLE_END} x2={SLIDE_W} y2={TITLE_END} stroke={T.border} strokeWidth={1} />

              {/* Week grid lines + labels */}
              {weeks.map((w, i) => {
                const x = xObj(w);
                if (x < CHART_X - 1) return null;
                const isMajor = w._major;
                return (
                  <g key={i}>
                    <line x1={x} y1={CHART_TOP} x2={x} y2={BODY_Y + rows.length * ROW_H}
                      stroke={isMajor ? T.gridMaj : T.grid}
                      strokeWidth={isMajor ? 1 : 0.5} />
                    {w._label && (
                      <text x={x + 10} y={CHART_TOP + HEADER_H / 2}
                        dominantBaseline="middle" fontSize={13} fontWeight={600}
                        fill={T.textLo} fontFamily={FONT}>
                        {w.toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                          ...(isMajor && w.getMonth() === 0 ? { year: '2-digit' } : {}),
                        })}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Today marker */}
              {todayMs && (
                <line x1={xOf(todayMs)} y1={CHART_TOP} x2={xOf(todayMs)} y2={BODY_Y + rows.length * ROW_H}
                  stroke={T.today} strokeWidth={2} strokeDasharray="5 4" />
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
                        stroke={T.grid} strokeWidth={0.5} />
                    )}

                    {/* Task label */}
                    <text x={PAD_X + LABEL_W - 28} y={rowY + ROW_H / 2}
                      dominantBaseline="middle" textAnchor="end"
                      fontSize={20} fontWeight={600} fill={T.textMid} fontFamily={FONT}>
                      {row.label}
                    </text>

                    {/* Track */}
                    <rect x={bx} y={barY} width={bw} height={BAR_H}
                      rx={br} ry={br} fill={T.track} />

                    {/* Progress fill */}
                    {row.progress > 0 && (
                      <rect x={bx} y={barY} width={fillW} height={BAR_H}
                        rx={br} ry={br} fill={T.fill} />
                    )}
                  </g>
                );
              })}

              {/* Bottom rule */}
              <line x1={PAD_X} y1={BODY_Y + rows.length * ROW_H}
                x2={SLIDE_W - PAD_X} y2={BODY_Y + rows.length * ROW_H}
                stroke={T.border} strokeWidth={1} />

              {/* Footer */}
              <text x={SLIDE_W - PAD_X} y={SLIDE_H - FOOTER_H / 2}
                dominantBaseline="middle" textAnchor="end"
                fontSize={13} fill={T.textLo} fontFamily={FONT}>
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
            Download {theme}
          </button>
        </div>
      </div>
    </div>
  );
}
