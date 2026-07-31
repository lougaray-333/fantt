import { useMemo, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import { getTaskColor, getAllGroups } from '../utils/colors';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const PAD_X   = 88;
const RED     = '#E52222';
const BLACK   = '#111111';
const FONT    = "'Helvetica Neue', Arial, sans-serif";

// Fantasy logo path (favicon.svg viewBox 0 0 129 130)
const LOGO_PATH = 'M128.992248 24.2154558c0-7.837565-5.278685-17.83768403-17.043423-22.47559798-15.2381769-6.00684349-21.1734328 12.15235358-47.452701 12.15235358s-32.214524-18.15919707-47.4527007-12.15235358c-11.76473803 4.63791395-17.0434233 14.63803298-17.0434233 22.47559798 0 10.2510088 12.8466605 17.4455479 12.8466605 40.8021625 0 23.3569371-12.8466605 30.5514761-12.8466605 40.8024847 0 7.837565 5.27868527 17.838007 17.0434233 22.475598 15.2381767 6.006521 21.1734325-12.152353 47.4527007-12.152353s32.2145241 18.158874 47.452701 12.152353c11.764738-4.637591 17.043423-14.638033 17.043423-22.475598 0-10.2510086-12.84666-17.4455476-12.84666-40.8024847 0-23.3566146 12.84666-30.5511537 12.84666-40.8021625';

export default function SlideExportModal({ tasks, projectName, onClose }) {
  const svgRef  = useRef(null);
  const [title, setTitle] = useState('High-Level Engagement Timeline');

  const slideTasks = useMemo(() => {
    const marked = tasks.filter(t => t.inSlide);
    return marked.length > 0 ? marked : tasks;
  }, [tasks]);

  const allGroups = useMemo(() => getAllGroups(slideTasks), [slideTasks]);

  const rows = useMemo(() =>
    slideTasks
      .map(t => ({ ...t, label: t.name }))
      .sort((a, b) => a.start.localeCompare(b.start)),
  [slideTasks]);

  // Build sequential week list starting from Monday of earliest task
  const weeks = useMemo(() => {
    if (!rows.length) return [];
    const rs = new Date(Math.min(...rows.map(r => new Date(r.start + 'T00:00:00'))));
    const re = new Date(Math.max(...rows.map(r => new Date(r.end   + 'T00:00:00'))));
    const anchor = new Date(rs);
    const dow = anchor.getDay();
    anchor.setDate(anchor.getDate() - (dow === 0 ? 6 : dow - 1));
    const list = [];
    const cur  = new Date(anchor);
    let   n    = 1;
    while (cur <= re) {
      list.push({ date: new Date(cur), num: n++ });
      cur.setDate(cur.getDate() + 7);
    }
    return list;
  }, [rows]);

  // ── Layout ───────────────────────────────────────────────────────────────
  const TITLE_FONT    = 72;
  const TITLE_BASE_Y  = 88 + TITLE_FONT;           // baseline of title text
  const TABLE_TOP     = TITLE_BASE_Y + 64;
  const BANNER_H      = 46;                         // "Week" black header row
  const LABEL_H       = 54;                         // "Week N / date" sub-row
  const HDR_H         = BANNER_H + LABEL_H;
  const FOOTER_ZONE   = 72;
  const TABLE_LEFT    = PAD_X;
  const TABLE_RIGHT   = SLIDE_W - PAD_X;
  const TABLE_W       = TABLE_RIGHT - TABLE_LEFT;
  const TASK_COL_W    = Math.round(TABLE_W * 0.50); // 50/50 split
  const WEEKS_W       = TABLE_W - TASK_COL_W;
  const COL_W         = weeks.length > 0 ? WEEKS_W / weeks.length : WEEKS_W;

  const AVAIL_ROWS = SLIDE_H - TABLE_TOP - HDR_H - FOOTER_ZONE;
  const ROW_H      = Math.min(90, Math.max(44, Math.floor(AVAIL_ROWS / Math.max(rows.length, 1))));
  const TABLE_H    = HDR_H + rows.length * ROW_H;
  const BODY_TOP   = TABLE_TOP + HDR_H;
  const BODY_BOT   = TABLE_TOP + TABLE_H;

  const LOGO_SCALE = 30 / 130;
  const LOGO_Y     = SLIDE_H - 54;

  function taskSpansWeek(task, weekStart) {
    const wEnd = new Date(weekStart);
    wEnd.setDate(wEnd.getDate() + 6);
    const tS = new Date(task.start + 'T00:00:00');
    const tE = new Date(task.end   + 'T00:00:00');
    return tS <= wEnd && tE >= weekStart;
  }

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
      a.download = `${(projectName || 'project').replace(/\s+/g, '-').toLowerCase()}-timeline.png`;
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

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text">Slide Preview</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {starredCount > 0
                ? `${starredCount} starred task${starredCount !== 1 ? 's' : ''}`
                : `All ${tasks.length} tasks`} · 1920×1080 PNG
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition">
            <X size={18} />
          </button>
        </div>

        {/* Title input */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <label className="text-xs font-medium text-text-muted mb-1.5 block">Slide title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. High-Level Engagement Timeline"
            className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
          />
        </div>

        {/* Preview */}
        <div className="p-5 bg-bg-alt overflow-auto">
          <div
            className="w-full rounded-lg overflow-hidden border border-border shadow-xl"
            style={{ aspectRatio: '16/9' }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ── Background ── */}
              <rect width={SLIDE_W} height={SLIDE_H} fill="white" />

              {/* ── Clip path for table contents ── */}
              <defs>
                <clipPath id="table-clip">
                  <rect x={TABLE_LEFT} y={TABLE_TOP} width={TABLE_W} height={TABLE_H} />
                </clipPath>
              </defs>

              {/* ── Title ── */}
              <text
                x={TABLE_LEFT} y={TITLE_BASE_Y}
                fontSize={TITLE_FONT} fontWeight={800}
                fill={BLACK} fontFamily={FONT}>
                {title || 'High-Level Engagement Timeline'}
              </text>

              {/* ── Table outer border ── */}
              <rect
                x={TABLE_LEFT} y={TABLE_TOP}
                width={TABLE_W} height={TABLE_H}
                fill="white" stroke={BLACK} strokeWidth={1.5}
              />

              {/* ── All table interior content clipped to table bounds ── */}
              <g clipPath="url(#table-clip)">

              {/* ── "Week" banner (black, spans week columns) ── */}
              <rect
                x={TABLE_LEFT + TASK_COL_W} y={TABLE_TOP}
                width={WEEKS_W} height={BANNER_H}
                fill={BLACK}
              />
              <text
                x={TABLE_LEFT + TASK_COL_W + WEEKS_W / 2}
                y={TABLE_TOP + BANNER_H / 2}
                dominantBaseline="middle" textAnchor="middle"
                fontSize={18} fontWeight={700} fill="white" fontFamily={FONT}>
                Week
              </text>

              {/* ── Week label sub-row ── */}
              {weeks.map((w, i) => {
                const cx      = TABLE_LEFT + TASK_COL_W + i * COL_W;
                const dateStr = w.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                return (
                  <g key={`wlbl-${i}`}>
                    {i > 0 && <>
                      {/* Divider through black banner */}
                      <line x1={cx} y1={TABLE_TOP} x2={cx} y2={TABLE_TOP + BANNER_H}
                        stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                      {/* Divider through label row */}
                      <line x1={cx} y1={TABLE_TOP + BANNER_H} x2={cx} y2={TABLE_TOP + HDR_H}
                        stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
                    </>}
                    <text
                      x={cx + COL_W / 2} y={TABLE_TOP + BANNER_H + LABEL_H * 0.34}
                      dominantBaseline="middle" textAnchor="middle"
                      fontSize={15} fontStyle="italic" fill={BLACK} fontFamily={FONT}>
                      {`Week ${w.num}`}
                    </text>
                    <text
                      x={cx + COL_W / 2} y={TABLE_TOP + BANNER_H + LABEL_H * 0.72}
                      dominantBaseline="middle" textAnchor="middle"
                      fontSize={13} fontStyle="italic" fill="rgba(0,0,0,0.45)" fontFamily={FONT}>
                      {dateStr}
                    </text>
                  </g>
                );
              })}

              {/* ── Header bottom border ── */}
              <line
                x1={TABLE_LEFT} y1={TABLE_TOP + HDR_H}
                x2={TABLE_RIGHT} y2={TABLE_TOP + HDR_H}
                stroke={BLACK} strokeWidth={1}
              />

              {/* ── Vertical divider: task names | weeks (full height) ── */}
              <line
                x1={TABLE_LEFT + TASK_COL_W} y1={TABLE_TOP}
                x2={TABLE_LEFT + TASK_COL_W} y2={BODY_BOT}
                stroke={BLACK} strokeWidth={1.5}
              />

              {/* ── Column dividers in body (dashed, full body height) ── */}
              {weeks.map((_, i) => {
                if (i === 0) return null;
                const cx = TABLE_LEFT + TASK_COL_W + i * COL_W;
                return (
                  <line key={`cdiv-${i}`}
                    x1={cx} y1={BODY_TOP} x2={cx} y2={BODY_BOT}
                    stroke="rgba(0,0,0,0.15)" strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* ── Row dividers (dashed, full table width) ── */}
              {rows.map((_, ri) => {
                if (ri === 0) return null;
                const ry = BODY_TOP + ri * ROW_H;
                return (
                  <line key={`rdiv-${ri}`}
                    x1={TABLE_LEFT} y1={ry} x2={TABLE_RIGHT} y2={ry}
                    stroke="rgba(0,0,0,0.18)" strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* ── Task rows ── */}
              {rows.map((row, ri) => {
                const rowY     = BODY_TOP + ri * ROW_H;
                const taskColor = getTaskColor(row, allGroups);
                return (
                  <g key={`row-${ri}`}>
                    {/* Task name */}
                    <text
                      x={TABLE_LEFT + 24} y={rowY + ROW_H / 2}
                      dominantBaseline="middle"
                      fontSize={19} fill={BLACK} fontFamily={FONT}>
                      {row.label}
                    </text>
                    {/* Filled week cells */}
                    {weeks.map((w, wi) => {
                      if (!taskSpansWeek(row, w.date)) return null;
                      const cellX = TABLE_LEFT + TASK_COL_W + wi * COL_W;
                      return (
                        <rect key={`cell-${ri}-${wi}`}
                          x={cellX + 1} y={rowY + 1}
                          width={COL_W - 2} height={ROW_H - 2}
                          fill={taskColor}
                        />
                      );
                    })}
                  </g>
                );
              })}

              </g>{/* end clip group */}

              {/* ── Fantasy logo ── */}
              <g transform={`translate(${TABLE_LEFT}, ${LOGO_Y}) scale(${LOGO_SCALE})`}>
                <path d={LOGO_PATH} fill={RED} fillRule="evenodd" />
              </g>
            </svg>
          </div>
        </div>

        {/* Footer actions */}
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
