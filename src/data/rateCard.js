export const RATE_CARD = [
  { department: 'Leadership', role: 'Managing Partner', rate: 29 },
  { department: 'Client Services', role: 'Engagement Director', rate: 27 },
  { department: 'Production', role: 'Group Director of Production', rate: 25 },
  { department: 'Production', role: 'Production Director', rate: 22 },
  { department: 'Production', role: 'Production Lead', rate: 17 },
  { department: 'Production', role: 'Senior Producer', rate: 14 },
  { department: 'Product Management', role: 'Senior Product Manager', rate: 22 },
  { department: 'Product Management', role: 'Associate Product Manager', rate: 14 },
  { department: 'UX', role: 'Group Director of Experience', rate: 27 },
  { department: 'UX', role: 'Experience Director', rate: 25 },
  { department: 'UX', role: 'Experience Lead', rate: 19 },
  { department: 'Design', role: 'Design Director', rate: 25 },
  { department: 'Design', role: 'Design Lead', rate: 19 },
  { department: 'Design', role: 'Senior Designer', rate: 14 },
  { department: 'Motion', role: 'Motion Lead', rate: 19 },
  { department: 'Motion', role: 'Senior Motion Designer', rate: 14 },
  { department: 'Content', role: 'Content Director', rate: 22 },
  { department: 'Content', role: 'Content Lead', rate: 17 },
  { department: 'Content', role: 'Senior Content Strategist', rate: 14 },
  { department: 'Research Strategy', role: 'Research Director', rate: 25 },
  { department: 'Research Strategy', role: 'Research Lead', rate: 19 },
  { department: 'Research Strategy', role: 'Senior Research Strategist', rate: 14 },
  { department: 'Technology', role: 'Technology Director', rate: 27 },
  { department: 'Technology', role: 'Technology Lead', rate: 22 },
  { department: 'Technology', role: 'Senior Developer', rate: 17 },
  { department: 'Technology', role: 'Developer', rate: 8 },
  { department: 'Technology', role: 'Functional Architect', rate: 25 },
  { department: 'Technology', role: 'QA Analyst', rate: 5 },
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
