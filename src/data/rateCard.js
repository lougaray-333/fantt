export const RATE_CARD = [
  { department: 'Leadership', role: 'Managing Partner', rate: 10 },
  { department: 'Client Services', role: 'Engagement Director', rate: 9 },
  { department: 'Production', role: 'Group Director of Production', rate: 8 },
  { department: 'Production', role: 'Production Director', rate: 7 },
  { department: 'Production', role: 'Production Lead', rate: 5 },
  { department: 'Production', role: 'Senior Producer', rate: 4 },
  { department: 'Product Management', role: 'Senior Product Manager', rate: 7 },
  { department: 'Product Management', role: 'Associate Product Manager', rate: 4 },
  { department: 'UX', role: 'Group Director of Experience', rate: 9 },
  { department: 'UX', role: 'Experience Director', rate: 8 },
  { department: 'UX', role: 'Experience Lead', rate: 6 },
  { department: 'Design', role: 'Design Director', rate: 8 },
  { department: 'Design', role: 'Design Lead', rate: 6 },
  { department: 'Design', role: 'Senior Designer', rate: 4 },
  { department: 'Motion', role: 'Motion Lead', rate: 6 },
  { department: 'Motion', role: 'Senior Motion Designer', rate: 4 },
  { department: 'Content', role: 'Content Director', rate: 7 },
  { department: 'Content', role: 'Content Lead', rate: 5 },
  { department: 'Content', role: 'Senior Content Strategist', rate: 4 },
  { department: 'Research Strategy', role: 'Research Director', rate: 8 },
  { department: 'Research Strategy', role: 'Research Lead', rate: 6 },
  { department: 'Research Strategy', role: 'Senior Research Strategist', rate: 4 },
  { department: 'Technology', role: 'Technology Director', rate: 9 },
  { department: 'Technology', role: 'Technology Lead', rate: 7 },
  { department: 'Technology', role: 'Senior Developer', rate: 5 },
  { department: 'Technology', role: 'Developer', rate: 3 },
  { department: 'Technology', role: 'Functional Architect', rate: 8 },
  { department: 'Technology', role: 'QA Analyst', rate: 2 },
  { department: 'Misc', role: 'Accessibility Consultation', rate: 1 },
];

export function getDepartments() {
  const seen = new Set();
  return RATE_CARD.reduce((deps, entry) => {
    if (!seen.has(entry.department)) {
      seen.add(entry.department);
      deps.push(entry.department);
    }
    return deps;
  }, []);
}
