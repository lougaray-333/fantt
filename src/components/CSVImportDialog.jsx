import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, AlertTriangle } from 'lucide-react';
import { parseCSV, csvRowToTask } from '../utils/csv';

export default function CSVImportDialog({ open, onClose, onImport }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [fileName, setFileName] = useState('');
  const [parsedTasks, setParsedTasks] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [parseError, setParseError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setParsedTasks([]);
    setWarnings([]);
    setParseError('');
    setProjectName('');
    setDragging(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setParseError('Please select a .csv file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = parseCSV(text);

        if (rows.length === 0) {
          setParseError('No data rows found in CSV');
          return;
        }

        // Check for Name column
        if (!rows[0].hasOwnProperty('Name')) {
          setParseError('CSV must have a "Name" column');
          return;
        }

        const warns = [];
        const tasks = [];
        let fallbackDate = null;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row['Name'] || !row['Name'].trim()) {
            warns.push(`Row ${i + 2}: Skipped — no name`);
            continue;
          }

          const task = csvRowToTask(row, i, fallbackDate);

          if (!row['Start Date'] && !row['Due Date']) {
            warns.push(`Row ${i + 2}: "${task.name}" — missing dates, using defaults`);
          }

          // Update fallback for next row (chain sequentially)
          const taskEnd = new Date(task.end + 'T00:00:00');
          taskEnd.setDate(taskEnd.getDate() + 1);
          fallbackDate = task.end.replace(/-/g, '-'); // keep as YYYY-MM-DD
          // Actually advance by 1 day for next fallback
          const nextDay = new Date(task.end + 'T00:00:00');
          nextDay.setDate(nextDay.getDate() + 1);
          const y = nextDay.getFullYear();
          const m = String(nextDay.getMonth() + 1).padStart(2, '0');
          const d = String(nextDay.getDate()).padStart(2, '0');
          fallbackDate = `${y}-${m}-${d}`;

          tasks.push(task);
        }

        if (tasks.length === 0) {
          setParseError('No valid tasks found in CSV');
          return;
        }

        setFileName(file.name);
        setProjectName(file.name.replace(/\.csv$/i, ''));
        setParsedTasks(tasks);
        setWarnings(warns);
        setParseError('');
        setStep('preview');
      } catch (err) {
        setParseError(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleImport = () => {
    onImport(parsedTasks, projectName.trim() || 'Imported Project');
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex max-h-[85vh] w-[640px] flex-col rounded-xl border border-border bg-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-text">Import CSV</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {step === 'upload'
                ? 'Upload a CSV file to create a new project'
                : `${parsedTasks.length} tasks ready to import`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-alt hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 'upload' ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition ${
                  dragging
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/40 hover:bg-bg-alt/50'
                }`}
              >
                <Upload size={32} className="text-text-muted/50" />
                <p className="mt-3 text-sm font-medium text-text">
                  Drop a CSV file here or click to browse
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Accepts .csv files — Asana exports work great
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {parseError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">
                  <AlertTriangle size={14} />
                  {parseError}
                </div>
              )}

              {/* Format hint */}
              <div className="mt-4 rounded-lg border border-border bg-bg-alt/50 px-4 py-3">
                <p className="text-xs font-medium text-text-muted">Expected columns:</p>
                <p className="mt-1 text-[11px] text-text-muted/70">
                  Name, Section/Column, Start Date, Due Date, Duration, Assignee, Contributors, Hours Per Day, Description, Scoping Notes
                </p>
                <p className="mt-1.5 text-[11px] text-text-muted/70">
                  Only <strong>Name</strong> is required. Extra columns are ignored.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* File info */}
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-bg-alt/50 px-3 py-2">
                <FileText size={16} className="text-accent" />
                <span className="text-sm text-text">{fileName}</span>
                <button
                  onClick={() => setStep('upload')}
                  className="ml-auto text-xs text-accent hover:underline"
                >
                  Change file
                </button>
              </div>

              {/* Project name */}
              <label className="mb-4 block">
                <span className="text-xs font-medium text-text-muted">Project name</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <AlertTriangle size={12} />
                    {warnings.length} warning{warnings.length > 1 ? 's' : ''}
                  </p>
                  <ul className="mt-1 max-h-20 overflow-y-auto text-[11px] text-amber-600/80">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              <div className="rounded-lg border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-bg-alt/50">
                        <th className="px-3 py-2 text-left font-medium text-text-muted">#</th>
                        <th className="px-3 py-2 text-left font-medium text-text-muted">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-text-muted">Phase</th>
                        <th className="px-3 py-2 text-left font-medium text-text-muted">Start</th>
                        <th className="px-3 py-2 text-left font-medium text-text-muted">End</th>
                        <th className="px-3 py-2 text-left font-medium text-text-muted">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTasks.slice(0, 20).map((task, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-1.5 text-text-muted">{i + 1}</td>
                          <td className="px-3 py-1.5 text-text">{task.name}</td>
                          <td className="px-3 py-1.5 text-text-muted">{task.group}</td>
                          <td className="px-3 py-1.5 text-text-muted">{task.start}</td>
                          <td className="px-3 py-1.5 text-text-muted">{task.end}</td>
                          <td className="px-3 py-1.5 text-text-muted">
                            {task.assignees?.[0]?.name || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedTasks.length > 20 && (
                  <div className="border-t border-border/50 px-3 py-1.5 text-center text-[11px] text-text-muted">
                    ...and {parsedTasks.length - 20} more tasks
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-text-muted">
            {step === 'preview'
              ? `${parsedTasks.length} task${parsedTasks.length === 1 ? '' : 's'} will be imported`
              : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-text-muted hover:bg-bg-alt"
            >
              Cancel
            </button>
            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={parsedTasks.length === 0}
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Import {parsedTasks.length} Task{parsedTasks.length === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
