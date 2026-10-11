import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BaseGameTile from './BaseGameTile';

describe('BaseGameTile power-play marker', () => {
  it.each(['away', 'home'])('places the %s PP badge directly below its logo', side => {
    const awayTeam = { id: 'away-id', name: 'Away Team', abbreviation: 'AWY', score: 1, logo: '/away.png' };
    const homeTeam = { id: 'home-id', name: 'Home Team', abbreviation: 'HOM', score: 2, logo: '/home.png' };
    const powerPlayTeam = side === 'away' ? awayTeam : homeTeam;

    render(
      <BaseGameTile
        game={{
          id: 'hockey-game',
          league: 'NHL',
          date: '2026-10-10T20:00:00Z',
          status: { type: 'STATUS_IN_PROGRESS', state: 'in', completed: false },
          awayTeam,
          homeTeam,
        }}
        colorCoding={false}
        showTeamForm={false}
        powerPlayTeamId={powerPlayTeam.id}
      />
    );

    const logo = screen.getByRole('img', { name: `${powerPlayTeam.name} logo` });
    const marker = screen.getByRole('status', { name: `Power play for ${powerPlayTeam.name}` });

    expect(logo.parentElement).toHaveClass('team-logo-pp-stack');
    expect(marker.parentElement).toBe(logo.parentElement);
    expect(Array.from(logo.parentElement.children)).toEqual([logo, marker]);
  });

  it('hides additional info only for hockey tiles in detail mode', () => {
    const game = {
      id: 'hockey-game',
      league: 'NHL',
      date: '2026-10-10T20:00:00Z',
      status: { type: 'STATUS_IN_PROGRESS', state: 'in', completed: false },
      awayTeam: { id: 'away-id', name: 'Away Team', abbreviation: 'AWY', score: 1 },
      homeTeam: { id: 'home-id', name: 'Home Team', abbreviation: 'HOM', score: 2 },
    };
    const additionalInfo = () => <div data-testid="additional-info">Hockey last play</div>;
    const props = { game, colorCoding: false, showTeamForm: false, renderAdditionalInfo: additionalInfo };
    const { container, rerender } = render(<BaseGameTile {...props} isInDetailMode />);

    expect(container.querySelector('.additional-info-wrapper')).toBeNull();

    rerender(<BaseGameTile {...props} />);
    expect(container.querySelector('.additional-info-wrapper')).toBeInTheDocument();

    rerender(<BaseGameTile {...props} game={{ ...game, league: 'NFL' }} isInDetailMode />);
    expect(container.querySelector('.additional-info-wrapper')).toBeInTheDocument();
  });
});