// Team statistics service
// getTeamForm returns an empty array until a real form API is wired in.
// Previously returned randomised W/L/D data which was misleading.
export const getTeamForm = (_teamId, _league) => {
  return [];
};

export const getFormColor = (result) => {
  switch (result) {
    case 'W': return '#28a745';
    case 'L': return '#dc3545';
    case 'D': return '#ffc107';
    default: return '#6c757d';
  }
};
