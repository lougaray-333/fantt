export const RATE_CARD = [
  { department: 'Leadership', role: 'Managing Partner', rate: 100 },
  { department: 'Client Services', role: 'Engagement Director', rate: 95 },
  { department: 'Production', role: 'Group Director of Production', rate: 90 },
  { department: 'Production', role: 'Production Director', rate: 85 },
  { department: 'Production', role: 'Production Lead', rate: 75 },
  { department: 'Production', role: 'Senior Producer', rate: 70 },
  { department: 'Product Management', role: 'Senior Product Manager', rate: 85 },
  { department: 'Product Management', role: 'Associate Product Manager', rate: 70 },
  { department: 'UX', role: 'Group Director of Experience', rate: 95 },
  { department: 'UX', role: 'Experience Director', rate: 90 },
  { department: 'UX', role: 'Experience Lead', rate: 80 },
  { department: 'Design', role: 'Design Director', rate: 90 },
  { department: 'Design', role: 'Design Lead', rate: 80 },
  { department: 'Design', role: 'Senior Designer', rate: 70 },
  { department: 'Motion', role: 'Motion Lead', rate: 80 },
  { department: 'Motion', role: 'Senior Motion Designer', rate: 70 },
  { department: 'Content', role: 'Content Director', rate: 85 },
  { department: 'Content', role: 'Content Lead', rate: 75 },
  { department: 'Content', role: 'Senior Content Strategist', rate: 70 },
  { department: 'Research Strategy', role: 'Research Director', rate: 90 },
  { department: 'Research Strategy', role: 'Research Lead', rate: 80 },
  { department: 'Research Strategy', role: 'Senior Research Strategist', rate: 70 },
  { department: 'Technology', role: 'Technology Director', rate: 95 },
  { department: 'Technology', role: 'Technology Lead', rate: 85 },
  { department: 'Technology', role: 'Senior Developer', rate: 75 },
  { department: 'Technology', role: 'Developer', rate: 60 },
  { department: 'Technology', role: 'Functional Architect', rate: 90 },
  { department: 'Technology', role: 'QA Analyst', rate: 55 },
  { department: 'Misc', role: 'Accessibility Consultation', rate: 50 },
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
