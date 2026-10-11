import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HockeyDetailContent from './HockeyDetailContent';

const skaterKeys = ['goals', 'assists', 'plusMinus', 'hits', 'shotsTotal', 'timeOnIce'];
const goalieKeys = ['saves', 'shotsAgainst', 'goalsAgainst', 'savePct', 'timeOnIce'];

describe('HockeyDetailContent player stat tabs', () => {
  it('renders one team tab with goalie, defense, and offense stats', () => {
    const awayTeam = { id: 'away-id', abbreviation: 'AWY', displayName: 'Away Team' };
    const homeTeam = { id: 'home-id', abbreviation: 'HOM', displayName: 'Home Team' };
    render(
      <HockeyDetailContent
        game={{
          league: 'NHL',
          status: { type: 'STATUS_IN_PROGRESS', state: 'in' },
          awayTeam,
          homeTeam,
        }}
        data={{
          header: { competitions: [{ status: { type: { state: 'in' } } }] },
          plays: [],
          boxscore: {
            teams: [
              { homeAway: 'away', team: awayTeam },
              { homeAway: 'home', team: homeTeam },
            ],
            players: [
              {
                team: awayTeam,
                statistics: [
                  {
                    name: 'forwards',
                    keys: skaterKeys,
                    athletes: [{ athlete: { id: 'f1', jersey: '17', displayName: 'Noel Forward' }, stats: ['2', '1', '3', '4', '5', '18:22'] }],
                  },
                  {
                    name: 'defenses',
                    keys: skaterKeys,
                    athletes: [{ athlete: { id: 'd1', jersey: '4', displayName: 'Drew Defense' }, stats: ['0', '2', '-1', '3', '2', '21:05'] }],
                  },
                  {
                    name: 'goalies',
                    keys: goalieKeys,
                    athletes: [{ athlete: { id: 'g1', jersey: '31', displayName: 'Gabe Goalie' }, stats: ['28', '30', '2', '.933', '60:00'] }],
                  },
                ],
              },
              { team: homeTeam, statistics: [] },
            ],
          },
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'AWY' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HOM' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'AWY' }));

    expect(screen.getByText('Goalies')).toBeInTheDocument();
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('Offense')).toBeInTheDocument();
    expect(screen.getByText('Gabe Goalie')).toBeInTheDocument();
    expect(screen.getByText('Drew Defense')).toBeInTheDocument();
    expect(screen.getByText('Noel Forward')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader', { name: 'TOI' })).toHaveLength(3);
    expect(screen.getByText('93.3%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'HOM' }));
    expect(screen.getByText('Player statistics unavailable.')).toBeInTheDocument();
  });
});