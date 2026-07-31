import { useState, useCallback } from 'react';
import { X, ImageDown, FileDown, Sun, Moon, Box, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { buildGanttCanvas, downloadPNG, downloadPDF, saveToBox } from '../utils/exportUtils.js';
import { useBoxAuth } from '../hooks/useBoxAuth.js';

const TABS = [
  { id: 'png', label: 'PNG', icon: ImageDown },
  { id: 'pdf', label: 'PDF', icon: FileDown },
];

export default function ExportModal({ tasks = [], projectName = '', projectId = '', onClose }) {
  const [activeTab, setActiveTab] = useState('png');
  const [theme, setTheme]         = useState('dark');
  const [exporting, setExporting] = useState(false);
  const [boxSaving, setBoxSaving] = useState(false);
  const [boxMsg, setBoxMsg]       = useState(null); // { ok: bool, text: string }
  const [preview, setPreview]     = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [folderError, setFolderError] = useState('');

  const box = useBoxAuth();
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

  const handleSaveToBox = useCallback(async () => {
    if (!validTasks.length || !box.connected || !box.folderId) return;
    setBoxSaving(true);
    setBoxMsg(null);
    try {
      const result = await saveToBox({
        tasks: validTasks,
        projectName,
        theme,
        folderId:  box.folderId,
        projectId,
        getToken:  box.getToken,
        getFileId: box.getFileId,
        setFileId: box.setFileId,
      });
      setBoxMsg({
        ok:   true,
        text: result.versioned ? 'New version saved to Box' : 'Saved to Box',
      });
    } catch (err) {
      setBoxMsg({ ok: false, text: err.message || 'Upload failed' });
    } finally {
      setBoxSaving(false);
    }
  }, [validTasks, projectName, theme, box, projectId]);

  const handleSetFolder = useCallback(() => {
    setFolderError('');
    if (!folderInput.trim()) { setFolderError('Paste a Box folder link or ID'); return; }
    const ok = box.setFolder(folderInput.trim());
    if (!ok) setFolderError('Could not find a folder ID in that link');
    else setFolderInput('');
  }, [folderInput, box]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

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

          {/* Left panel */}
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

            {/* Box — only on PNG tab */}
            {activeTab === 'png' && (
              <div className="border-t border-border pt-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Box</p>

                {!box.connected ? (
                  <button
                    onClick={box.connect}
                    className="flex items-center gap-2 w-full rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-accent/30 hover:text-accent transition"
                  >
                    <Box size={12} />
                    Connect Box
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Connected indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                        <Check size={10} />
                        Connected
                      </div>
                      <button onClick={box.disconnect} className="text-[9px] text-text-muted hover:text-accent transition">
                        Disconnect
                      </button>
                    </div>

                    {/* Folder config */}
                    {!box.folderId ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] text-text-muted leading-relaxed">
                          Paste a Box folder link to set where files are saved:
                        </p>
                        <input
                          value={folderInput}
                          onChange={e => { setFolderInput(e.target.value); setFolderError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleSetFolder()}
                          placeholder="https://app.box.com/folder/…"
                          className="w-full rounded bg-bg border border-border px-2 py-1 text-[10px] text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40"
                        />
                        {folderError && <p className="text-[9px] text-red-400">{folderError}</p>}
                        <button
                          onClick={handleSetFolder}
                          className="rounded bg-accent/10 border border-accent/20 px-2 py-1 text-[10px] font-medium text-accent hover:bg-accent/20 transition"
                        >
                          Set folder
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] text-text-muted truncate" title={box.folderName}>
                          {box.folderName}
                        </p>
                        <button
                          onClick={() => box.setFolder('')}
                          className="text-[9px] text-text-muted hover:text-accent transition text-left"
                        >
                          Change folder
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Task count */}
            <div className="mt-auto pt-2 border-t border-border">
              <p className="text-[10px] text-text-muted">
                {validTasks.length} task{validTasks.length !== 1 ? 's' : ''} with dates
              </p>
            </div>
          </div>

          {/* Right panel — preview */}
          <div className="flex flex-1 flex-col min-w-0 p-4 gap-2.5">
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
                    Click "Render preview" to see how your export will look
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 129 130" fill="none">
              <path d="M128.992248 24.2154558c0-7.837565-5.278685-17.83768403-17.043423-22.47559798-15.2381769-6.00684349-21.1734328 12.15235358-47.452701 12.15235358s-32.214524-18.15919707-47.4527007-12.15235358c-11.76473803 4.63791395-17.0434233 14.63803298-17.0434233 22.47559798 0 10.2510088 12.8466605 17.4455479 12.8466605 40.8021625 0 23.3569371-12.8466605 30.5514761-12.8466605 40.8024847 0 7.837565 5.27868527 17.838007 17.0434233 22.475598 15.2381767 6.006521 21.1734325-12.152353 47.4527007-12.152353s32.2145241 18.158874 47.452701 12.152353c11.764738-4.637591 17.043423-14.638033 17.043423-22.475598 0-10.2510086-12.84666-17.4455476-12.84666-40.8024847 0-23.3566146 12.84666-30.5511537 12.84666-40.8021625" fill="#E52222"/>
            </svg>
            <span className="text-[10px] text-text-muted">Fantt Chart · by Fantasy</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Box feedback message */}
            {boxMsg && (
              <span className={`flex items-center gap-1 text-[10px] ${boxMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                {boxMsg.ok ? <Check size={10} /> : <AlertCircle size={10} />}
                {boxMsg.text}
              </span>
            )}

            {/* Save to Box — PNG only, when connected + folder set */}
            {activeTab === 'png' && box.connected && box.folderId && (
              <button
                onClick={handleSaveToBox}
                disabled={boxSaving || !validTasks.length}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-accent/30 hover:text-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {boxSaving ? (
                  <>
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Box size={12} />
                    Save to Box
                  </>
                )}
              </button>
            )}

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
