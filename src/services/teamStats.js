// Team statistics service
const FORM_STORAGE_KEY = 'teamFormData';

// Initialize or get form data from localStorage
const getStoredFormData = () => {
  try {
    return JSON.parse(localStorage.getItem(FORM_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

// Save form data to localStorage
const saveFormData = (formData) => {
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
};

// Get mock form data for demonstration (in real app, this would come from API)
export const getTeamForm = (teamId, league) => {
  const formData = getStoredFormData();
  const key = `${league}-${teamId}`;
  
  if (!formData[key]) {
    // Generate random form data for demonstration
    const results = ['W', 'L', 'D', 'W', 'L'].sort(() => Math.random() - 0.5);
    formData[key] = results;
    saveFormData(formData);
  }
  
  return formData[key];
};

// Get form display color
export const getFormColor = (result) => {
  switch (result) {
    case 'W': return '#28a745';
    case 'L': return '#dc3545';
    case 'D': return '#ffc107';
    default: return '#6c757d';
  }
};