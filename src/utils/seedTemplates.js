import { supabase } from '../lib/supabase';

// All shared/system templates are owned by this sentinel email.
// No real user has this email, so nobody can delete or mutate system templates.
export const SYSTEM_EMAIL = '__fantasy_shared__';

const FANTASY = '#6366f1'; // indigo  — Fantasy production work
const CLIENT  = '#f59e0b'; // amber   — Microsoft review / approval

// All templates anchor to the same reference Monday so the schedules
// read cleanly when a user opens the template before adjusting dates.
const MONDAY = '2026-08-03';

function addBizDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  let added = 0;
  while (added < n) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) added++;
  }
  return date.toISOString().slice(0, 10);
}

// Day 0 = the Friday before the anchor Monday (Production KO)
const D0 = (() => {
  const [y, m, d] = MONDAY.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 3)).toISOString().slice(0, 10);
})();

const D1 = MONDAY;
const D2 = addBizDays(D1, 1);
const D3 = addBizDays(D1, 2);
const D4 = addBizDays(D1, 3);
const D5 = addBizDays(D1, 4);
const D6 = addBizDays(D1, 5);
const D7 = addBizDays(D1, 6);
const D8 = addBizDays(D1, 7);

// Each template is a name + flat ordered task list.
// Dependencies are built as a linear chain (each task depends on the one before it).
const TEMPLATES = [
  {
    name: '1–2 Videos — 5-Day Cadence',
    tasks: [
      { name: 'Production Kickoff',         start: D0, end: D0, color: FANTASY },
      { name: 'Video Creation — Round 1',   start: D1, end: D1, color: FANTASY },
      { name: 'Round 1 Review & Feedback',  start: D2, end: D2, color: CLIENT  },
      { name: 'Video Revision — Round 2',   start: D3, end: D3, color: FANTASY },
      { name: 'Round 2 Approval',           start: D4, end: D4, color: CLIENT  },
      { name: 'Package & Delivery',         start: D5, end: D5, color: FANTASY },
    ],
  },
  {
    name: '4 Videos — 6-Day Cadence',
    tasks: [
      { name: 'Production Kickoff',               start: D0, end: D0, color: FANTASY },
      { name: 'Videos 1 & 2 — Creation',          start: D1, end: D1, color: FANTASY },
      { name: 'Videos 3 & 4 — Creation',          start: D2, end: D2, color: FANTASY },
      { name: 'Round 1 Review & Feedback',         start: D3, end: D3, color: CLIENT  },
      { name: 'Videos 1–4 — Round 1 Revision',    start: D4, end: D4, color: FANTASY },
      { name: 'Round 1 Approval',                  start: D5, end: D5, color: CLIENT  },
      { name: 'Package & Delivery',                start: D6, end: D6, color: FANTASY },
    ],
  },
  {
    name: '6 Videos — 8-Day Cadence',
    tasks: [
      { name: 'Production Kickoff',                          start: D0, end: D0, color: FANTASY },
      { name: 'Videos 1 & 2 — Creation',                    start: D1, end: D1, color: FANTASY },
      { name: 'Videos 3 & 4 — Creation',                    start: D2, end: D2, color: FANTASY },
      { name: 'Videos 5 & 6 — Creation',                    start: D3, end: D3, color: FANTASY },
      // Review of 1–4 begins same day as videos 5–6 creation (Day 3)
      { name: 'Round 1 Review — Videos 1–4',                start: D3, end: D4, color: CLIENT  },
      // Review of 5–6 + all feedback consolidated by EOD Day 4
      { name: 'Round 1 Review — Videos 5–6 & All Feedback', start: D4, end: D4, color: CLIENT  },
      { name: 'Videos 1–4 — Round 1 Revision',              start: D5, end: D5, color: FANTASY },
      { name: 'Videos 5–6 — Round 1 Revision',              start: D6, end: D6, color: FANTASY },
      { name: 'Final Approval — All Videos',                 start: D7, end: D7, color: CLIENT  },
      { name: 'Package & Delivery',                          start: D8, end: D8, color: FANTASY },
    ],
  },
];

// Seeded once globally — not per user. Uses SYSTEM_EMAIL so no real user owns them.
export async function seedDefaultTemplates() {
  for (const tmpl of TEMPLATES) {
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .insert({ email: SYSTEM_EMAIL, name: tmpl.name, is_template: true, is_shared: true })
      .select()
      .single();
    if (pErr) { console.error('[seedTemplates] project insert failed:', pErr); continue; }

    // Pre-generate IDs so each task can reference the previous task's ID
    const ids = tmpl.tasks.map(() => crypto.randomUUID());

    const rows = tmpl.tasks.map((t, i) => ({
      id: ids[i],
      project_id: project.id,
      name: t.name,
      start_date: t.start,
      end_date: t.end,
      color: t.color,
      group: '',
      dependencies: i > 0 ? [ids[i - 1]] : [],
      progress: 0,
      auto_progress: false,
      sort_order: i,
      assignees: [],
    }));

    const { error: tErr } = await supabase.from('tasks').insert(rows);
    if (tErr) console.error('[seedTemplates] tasks insert failed:', tErr);
  }
}
