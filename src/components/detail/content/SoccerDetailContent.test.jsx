import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SoccerDetailContent from './SoccerDetailContent';

const player = (id, name, jersey, position, formationPlace, options = {}) => ({
  active: true,
  starter: options.starter ?? true,
  jersey: String(jersey),
  athlete: { id, displayName: name, lastName: name.split(' ').at(-1) },
  position: { name: position, abbreviation: position },
  formationPlace: String(formationPlace),
  subbedIn: options.subbedIn ?? false,
  subbedOut: options.subbedOut ?? false,
  stats: [
    { name: 'totalGoals', value: options.goals ?? 0, displayValue: String(options.goals ?? 0) },
    { name: 'yellowCards', value: options.yellowCards ?? 0, displayValue: String(options.yellowCards ?? 0) },
    { name: 'redCards', value: 0, displayValue: '0' },
  ],
});

describe('SoccerDetailContent lineups', () => {
  it('shows commentary and a team formation with player events and substitution status', () => {
    const awayTeam = { id: 'away', abbreviation: 'AWY', displayName: 'Away FC' };
    const homeTeam = { id: 'home', abbreviation: 'HOM', displayName: 'Home FC' };
    render(
      <SoccerDetailContent
        game={{ status: { state: 'post' }, awayTeam, homeTeam }}
        data={{
          boxscore: { teams: [
            { homeAway: 'away', team: awayTeam, statistics: [{ name: 'totalShots', displayValue: '8' }] },
            { homeAway: 'home', team: homeTeam, statistics: [{ name: 'totalShots', displayValue: '5' }] },
          ] },
          header: { competitions: [{ status: { type: { state: 'in' } } }] },
          keyEvents: [{
            type: { type: 'goal' },
            scoringPlay: true,
            clock: { displayValue: "4'" },
            shortText: 'Opening goal',
            team: { id: 'away' },
          }],
          commentary: [
            { text: 'The match is underway.', time: { displayValue: "1'" } },
            { text: 'Latest commentary update.', time: { displayValue: "4'" } },
          ],
          rosters: [
            {
              team: { id: 'away', abbreviation: 'AWY', displayName: 'Away FC', color: 'ffffff', alternateColor: '12284c' },
              formation: '4-2-3-1',
              roster: [
                player('keeper', 'Alex Keeper', 1, 'Goalkeeper', 1),
                player('leftBack', 'Sam Defender', 4, 'LB', 3, { yellowCards: 1 }),
                player('centerLeft', 'Casey Center Left', 5, 'CD-L', 6),
                player('centerRight', 'Chris Center Right', 6, 'CD-R', 5),
                player('rightBack', 'Riley Right Back', 2, 'RB', 2),
                player('scorer', 'Pat Scorer', 9, 'F', 9, { goals: 2 }),
                player('attackingLeft', 'Ari Attacking Left', 10, 'AM-L', 11),
                player('attackingMid', 'Alex Attacking Mid', 8, 'AM', 10),
                player('attackingRight', 'Andy Attacking Right', 7, 'AM-R', 7),
                player('sub', 'Jo Substitute', 12, 'Substitute', 0, { starter: false, subbedIn: true }),
                player('left', 'Lee Left', 14, 'LM', 4, { subbedOut: true }),
                player('right', 'Rey Right', 15, 'RM', 8),
              ],
            },
            {
              team: { id: 'home', abbreviation: 'HOM', displayName: 'Home FC' },
              roster: [],
            },
          ],
        }}
      />
    );

    expect(screen.getByRole('tab', { name: 'Commentary' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('The match is underway.')).toBeInTheDocument();
    expect(document.querySelector('.last-play-text')?.textContent).toBe('Latest commentary update.');
    expect(document.querySelector('.last-play-time')?.textContent).toBe("4'");
    expect(screen.getByText('Opening goal')).toBeInTheDocument();
    expect(document.querySelector('.key-events-cols ~ .detail-tabs')).not.toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Match Stats' }));
    expect(screen.getByText('Shots')).toBeInTheDocument();
    expect(document.querySelector('.live-ticker')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'AWY' }));

    expect(screen.getByText('Formation 4-2-3-1')).toBeInTheDocument();
    expect(screen.getByText('Sam Defender')).toBeInTheDocument();
    expect(screen.getByText('AM-L')).toBeInTheDocument();
    expect(screen.getByLabelText('1 yellow cards')).toBeInTheDocument();
    expect(screen.getByLabelText('2 goals')).toBeInTheDocument();
    expect(screen.getByText('Subbed in')).toBeInTheDocument();
    expect(screen.getByText('Subbed out')).toBeInTheDocument();
    expect(document.querySelectorAll('.soccer-pitch-line--attacking-midfield .soccer-pitch-player')).toHaveLength(3);
    expect(document.querySelectorAll('.soccer-pitch-line--midfield .soccer-pitch-player')).toHaveLength(2);
    expect(Array.from(document.querySelectorAll('.soccer-pitch-line--attacking-midfield .soccer-pitch-name'), playerName => playerName.textContent))
      .toEqual(['Left', 'Mid', 'Right']);
    expect(document.querySelector('.soccer-lineup').style.getPropertyValue('--soccer-team-color')).toBe('#12284c');
    expect(screen.getByRole('tab', { name: 'AWY' })).toHaveAttribute('aria-selected', 'true');
  });
});