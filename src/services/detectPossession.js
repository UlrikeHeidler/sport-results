/**
 * Detect which team has possession from ESPN competition data.
 */
export const detectPossession = (competitionObj, homeTeamObj, awayTeamObj) => {
  if (!competitionObj) return { which: null, label: null };

  const situation = competitionObj.situation || {};
  let raw = situation.possession || situation.possessionText || null;
  const currentPlay = competitionObj.drives?.currentPlay;

  if (currentPlay) {
    if (currentPlay.team && (currentPlay.team.id || currentPlay.team.abbreviation || currentPlay.team.displayName)) {
      raw = currentPlay.team.id || currentPlay.team.abbreviation || currentPlay.team.displayName || raw;
    } else if (currentPlay.possessionTeamId) {
      raw = currentPlay.possessionTeamId;
    }
  }

  if (raw && typeof raw === 'object') {
    if (raw.id) raw = String(raw.id);
    else if (raw.abbreviation) raw = String(raw.abbreviation);
    else if (raw.displayName) raw = String(raw.displayName);
  }

  const normalize = value => (value == null ? null : String(value).toLowerCase());
  const rawNormalized = normalize(raw);
  const candidates = team => [
    team?.id,
    team?.competitorId,
    team?.abbreviation,
    team?.name,
    team?.displayName
  ].map(normalize).filter(Boolean);
  const homeCandidates = new Set(candidates(homeTeamObj));
  const awayCandidates = new Set(candidates(awayTeamObj));

  const lastPlayTeam = situation.lastPlay?.team;
  const lastPlayLabel = lastPlayTeam?.id || lastPlayTeam?.abbreviation ||
    lastPlayTeam?.displayName || lastPlayTeam?.name;
  if (lastPlayLabel) {
    const lastPlayNormalized = normalize(lastPlayLabel);
    if (homeCandidates.has(lastPlayNormalized)) return { which: 'home', label: lastPlayLabel };
    if (awayCandidates.has(lastPlayNormalized)) return { which: 'away', label: lastPlayLabel };
  }

  if (rawNormalized && homeCandidates.has(rawNormalized)) return { which: 'home', label: raw };
  if (rawNormalized && awayCandidates.has(rawNormalized)) return { which: 'away', label: raw };
  if (rawNormalized === 'home' || rawNormalized === 'away') {
    return { which: rawNormalized, label: raw };
  }

  if (typeof situation.possessionText === 'string') {
    const text = situation.possessionText.toLowerCase();
    const firstWord = text.split(' ')[0];
    if (firstWord && homeCandidates.has(firstWord)) return { which: 'home', label: situation.possessionText };
    if (firstWord && awayCandidates.has(firstWord)) return { which: 'away', label: situation.possessionText };
    if (text.includes('home')) return { which: 'home', label: situation.possessionText };
    if (text.includes('away')) return { which: 'away', label: situation.possessionText };
  }

  if (situation.possessionTeamId) {
    const possessionTeamId = normalize(situation.possessionTeamId);
    if (homeCandidates.has(possessionTeamId)) return { which: 'home', label: situation.possessionTeamId };
    if (awayCandidates.has(possessionTeamId)) return { which: 'away', label: situation.possessionTeamId };
  }

  return { which: null, label: raw ?? null };
};
