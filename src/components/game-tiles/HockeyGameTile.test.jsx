import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HockeyGameTile from './HockeyGameTile';

vi.mock('./BaseGameTile', () => ({
  default: ({ renderAdditionalInfo }) => renderAdditionalInfo(),
}));

describe('HockeyGameTile last-play marker', () => {
  it.each([
    ['goal', '🥅'],
    ['penalty', '🚫'],
  ])('renders a %s marker before the logo and play text in one row', (type, marker) => {
    const text = type === 'penalty' ? 'Jeremy Lauzon Minor' : 'Trevor Connelly Goal';
    const game = {
      id: 'nhl-game',
      league: 'NHL',
      status: { type: 'STATUS_FINAL' },
      awayTeam: { id: 'away-team', logo: '/away.png' },
      homeTeam: { id: 'home-team', logo: '/home.png' },
      situation: {
        lastPlay: text,
        lastPlayTeam: 'away-team',
        timeline: [
          { type, text, team: 'away-team' },
        ],
      },
    };

    const { container } = render(<HockeyGameTile game={game} />);
    const row = container.querySelector('.hockey-last-play');

    expect(row.children).toHaveLength(3);
    expect(row.children[0]).toHaveTextContent(marker);
    expect(row.children[1]).toHaveClass('nhl-timeline-logo');
    expect(row.children[2]).toHaveClass('hockey-last-play-text');
    expect(row.children[2]).toHaveTextContent(text);
    expect(container.querySelector('.hockey-timeline')).toBeNull();
  });

  it('does not show a previous event marker for an ordinary last play', () => {
    const game = {
      id: 'nhl-game',
      league: 'NHL',
      status: { type: 'STATUS_FINAL' },
      awayTeam: { id: 'away-team', logo: '/away.png' },
      situation: {
        lastPlay: 'Faceoff won',
        lastPlayTeam: 'away-team',
        timeline: [{ type: 'penalty', text: 'Earlier penalty', team: 'away-team' }],
      },
    };

    const { container } = render(<HockeyGameTile game={game} />);

    expect(container.querySelector('.hockey-last-play-marker')).toBeNull();
    expect(container.querySelector('.hockey-last-play-text')).toHaveTextContent('Faceoff won');
  });
});