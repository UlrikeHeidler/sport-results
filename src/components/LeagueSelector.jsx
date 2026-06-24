import { useCallback, useMemo } from 'react';
import { SPORT_GROUPS, LEAGUE_INFO } from '../config/constants';

const SPORT_EMOJI = {
  Football:   '🏈',
  Hockey:     '🏒',
  Baseball:   '⚾',
  Soccer:     '⚽',
  Basketball: '🏀',
};

const LeagueSelector = ({ selectedLeagues, onLeagueToggle, onSelectLeagues, availableLeagues }) => {
  const selectedSet = useMemo(() => new Set(selectedLeagues), [selectedLeagues]);

  const groups = SPORT_GROUPS
    .map(group => ({ ...group, leagues: group.leagues.filter(l => availableLeagues.includes(l)) }))
    .filter(group => group.leagues.length > 0);

  const toggleSportGroup = useCallback((groupLeagues) => {
    const available = groupLeagues.filter(l => availableLeagues.includes(l));
    const allSelected = available.every(l => selectedSet.has(l));
    const newLeagues = allSelected
      ? selectedLeagues.filter(l => !available.includes(l))
      : [...new Set([...selectedLeagues, ...available])];
    onSelectLeagues(newLeagues);
  }, [availableLeagues, selectedLeagues, selectedSet, onSelectLeagues]);

  const toggleAll = useCallback((selectAll) => {
    onSelectLeagues(selectAll ? [...availableLeagues] : []);
  }, [availableLeagues, onSelectLeagues]);

  const totalSelected = selectedLeagues.length;
  const totalAvailable = availableLeagues.length;

  return (
    <div className="league-selector">
      <div className="league-selector-header">
        <span className="league-selector-count">{totalSelected} / {totalAvailable} leagues</span>
        <button
          className="league-selector-ctrl"
          onClick={() => toggleAll(true)}
          disabled={totalSelected === totalAvailable}
        >
          All
        </button>
        <button
          className="league-selector-ctrl"
          onClick={() => toggleAll(false)}
          disabled={totalSelected === 0}
        >
          None
        </button>
      </div>

      {groups.map(group => {
        const selectedCount = group.leagues.filter(l => selectedSet.has(l)).length;
        const allSelected = selectedCount === group.leagues.length;
        const someSelected = selectedCount > 0 && !allSelected;

        return (
          <div key={group.sport} className="sport-group">
            <button
              className={`sport-header${allSelected ? ' all-selected' : someSelected ? ' some-selected' : ''}`}
              onClick={() => toggleSportGroup(group.leagues)}
              title={`Toggle all ${group.sport} leagues`}
            >
              <span className="sport-emoji">{SPORT_EMOJI[group.sport] ?? '🏆'}</span>
              <span className="sport-name">{group.sport}</span>
              <span className="sport-count">{selectedCount}/{group.leagues.length}</span>
            </button>
            <div className="league-chips">
              {group.leagues.map(league => {
                const info = LEAGUE_INFO[league];
                return (
                  <button
                    key={league}
                    className={`league-chip${selectedSet.has(league) ? ' active' : ''}`}
                    onClick={() => onLeagueToggle(league)}
                    title={info?.fullName}
                  >
                    {info?.name ?? league.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedLeagues.length === 0 && (
        <p className="no-selection">Select at least one league to view games</p>
      )}
    </div>
  );
};

export default LeagueSelector;
