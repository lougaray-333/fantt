import { useState, useCallback } from 'react';
import { X, ImageDown, FileDown, Sun, Moon } from 'lucide-react';
import { buildGanttCanvas, downloadPNG, downloadPDF } from '../utils/exportUtils.js';

const TABS = [
  { id: 'png', label: 'PNG', icon: ImageDown },
  { id: 'pdf', label: 'PDF', icon: FileDown },
];

export default function ExportModal({ tasks = [], projectName = '', onClose }) {
  const [activeTab, setActiveTab]   = useState('png');
  const [theme, setTheme]           = useState('dark');
  const [exporting, setExporting]   = useState(false);
  const [preview, setPreview]       = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const validTasks = tasks.filter(t => t.start && t.end);

  const handlePreview = useCallback(async () => {
    setPreviewing(true);
    setPreview(null);
    try {
      const canvas = await buildGanttCanvas(validTasks, projectName, theme);
      if (canvas) setPreview(canvas.toDataURL('image/png'));
    } finally {
      setPreviewing(false);
    }
  }, [validTasks, projectName, theme]);

  const handleExport = useCallback(async () => {
    if (!validTasks.length) return;
    setExporting(true);
    try {
      if (activeTab === 'png') {
        const canvas = await buildGanttCanvas(validTasks, projectName, theme);
        if (canvas) downloadPNG(canvas, projectName);
      } else if (activeTab === 'pdf') {
        await downloadPDF(validTasks, projectName, theme, 'fit');
      }
    } finally {
      setExporting(false);
    }
  }, [activeTab, validTasks, projectName, theme]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex flex-col w-[680px] max-h-[90vh] rounded-2xl border border-border bg-bg-alt shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
              <FileDown size={14} className="text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Export</h2>
              <p className="text-[10px] text-text-muted">{projectName || 'Gantt Chart'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-bg-alt/80 text-text-muted hover:text-text transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left panel — options */}
          <div className="flex flex-col gap-4 w-52 shrink-0 px-4 py-4 border-r border-border overflow-y-auto">

            {/* Format */}
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Format</p>
              <div className="flex flex-col gap-0.5">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setPreview(null); }}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        activeTab === tab.id
                          ? 'bg-accent/10 text-accent border border-accent/20'
                          : 'text-text-muted hover:bg-bg hover:text-text'
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme */}
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Theme</p>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => { setTheme('dark'); setPreview(null); }}
                  className={`flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition ${
                    theme === 'dark' ? 'bg-accent text-white' : 'text-text-muted hover:bg-bg hover:text-text'
                  }`}
                >
                  <Moon size={10} /> Dark
                </button>
                <button
                  onClick={() => { setTheme('light'); setPreview(null); }}
                  className={`flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition ${
                    theme === 'light' ? 'bg-accent text-white' : 'text-text-muted hover:bg-bg hover:text-text'
                  }`}
                >
                  <Sun size={10} /> Light
                </button>
              </div>
            </div>



            {/* Task count */}
            <div className="mt-auto pt-2 border-t border-border">
              <p className="text-[10px] text-text-muted">
                {validTasks.length} task{validTasks.length !== 1 ? 's' : ''} with dates
              </p>
            </div>
          </div>

          {/* Right panel — preview */}
          <div className="flex flex-1 flex-col min-w-0 p-4 gap-3">
            <div className="flex flex-1 flex-col gap-2.5 min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Preview</p>
                <button
                  onClick={handlePreview}
                  disabled={previewing || !validTasks.length}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-medium text-text-muted hover:border-accent/30 hover:text-accent transition disabled:opacity-40"
                >
                  {previewing ? 'Rendering…' : 'Render preview'}
                </button>
              </div>

              <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-bg overflow-hidden min-h-0">
                {preview ? (
                  <img src={preview} alt="Gantt preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-8">
                    <ImageDown size={28} className="text-accent/30" />
                    <p className="text-[11px] text-text-muted">
                      Click "Render preview" to see a preview of your export
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 129 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M128.992248 24.2154558c0-7.837565-5.278685-17.83768403-17.043423-22.47559798-15.2381769-6.00684349-21.1734328 12.15235358-47.452701 12.15235358s-32.214524-18.15919707-47.4527007-12.15235358c-11.76473803 4.63791395-17.0434233 14.63803298-17.0434233 22.47559798 0 10.2510088 12.8466605 17.4455479 12.8466605 40.8021625 0 23.3569371-12.8466605 30.5514761-12.8466605 40.8024847 0 7.837565 5.27868527 17.838007 17.0434233 22.475598 15.2381767 6.006521 21.1734325-12.152353 47.4527007-12.152353s32.2145241 18.158874 47.452701 12.152353c11.764738-4.637591 17.043423-14.638033 17.043423-22.475598 0-10.2510086-12.84666-17.4455476-12.84666-40.8024847 0-23.3566146 12.84666-30.5511537 12.84666-40.8021625" fill="#E52222"/>
            </svg>
            <span className="text-[10px] text-text-muted">Fantt Chart · by Fantasy</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-bg transition">
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || !validTasks.length}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <FileDown size={12} />
                  Download {activeTab.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
