import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HockeyGameTile from './HockeyGameTile';
import { fetchGameSummary } from '../../services/sportsApi';
import { normalizeGameSummary } from '../../services/normalizeGameSummary';
import { isShootoutInProgress } from '../shared/ShootoutTracker';

vi.mock('./BaseGameTile', () => ({
  default: ({ renderAdditionalInfo }) => renderAdditionalInfo(),
}));

vi.mock('../../services/sportsApi', () => ({
  fetchGameSummary: vi.fn(),
}));

vi.mock('../../services/normalizeGameSummary', () => ({
  normalizeGameSummary: vi.fn(),
}));

describe('HockeyGameTile last-play marker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('only identifies an active shootout while the event is in progress', () => {
    const shootoutHeader = {
      competitions: [{
        status: { period: 5, type: { state: 'in', detail: 'In SO' } },
      }],
    };

    expect(isShootoutInProgress({ status: { type: 'STATUS_IN_PROGRESS' } }, shootoutHeader)).toBe(true);
    expect(isShootoutInProgress(
      { status: { type: 'STATUS_FINAL', completed: true } },
      shootoutHeader
    )).toBe(false);
  });

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

  it('replaces the last play with current shootout attempts while a shootout is live', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const summary = {
      header: {
        competitions: [{
          status: { period: 5, type: { state: 'in', detail: 'In SO' } },
        }],
      },
      plays: [
        {
          id: 'attempt-1',
          type: { text: 'Shot' },
          text: 'Ottawa attempt saved',
          team: { id: 'away-team' },
          period: { number: 5, displayValue: 'SO' },
        },
        {
          id: 'attempt-2',
          type: { text: 'Goal' },
          text: 'Islanders shootout goal',
          scoreValue: 1,
          team: { id: 'home-team' },
          period: { number: 5, displayValue: 'SO' },
        },
      ],
    };
    vi.mocked(fetchGameSummary).mockResolvedValue(summary);
    vi.mocked(normalizeGameSummary).mockReturnValue({});
    const game = {
      id: 'nhl-game',
      league: 'NHL',
      status: { type: 'STATUS_IN_PROGRESS', period: 5, altDetail: 'SO' },
      awayTeam: { id: 'away-team', abbreviation: 'OTT', logo: '/away.png' },
      homeTeam: { id: 'home-team', abbreviation: 'NYI', logo: '/home.png' },
      situation: { lastPlay: 'Outdated live play' },
    };

    render(<HockeyGameTile game={game} />);

    await waitFor(() => expect(screen.getByRole('group', { name: 'Shootout results' })).toBeInTheDocument());
    expect(screen.getByLabelText('OTT: 0 goals from 1 attempts')).toBeInTheDocument();
    expect(screen.getByLabelText('NYI: 1 goals from 1 attempts')).toBeInTheDocument();
    expect(screen.queryByText('Outdated live play')).not.toBeInTheDocument();
  });

  it('refreshes shootout results every five seconds while the tile is live', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', undefined);
    const summary = {
      header: {
        competitions: [{
          status: { period: 5, type: { state: 'in', detail: 'In SO' } },
        }],
      },
      plays: [{
        id: 'attempt',
        type: { text: 'Shot' },
        team: { id: 'away-team' },
        period: { number: 5, displayValue: 'SO' },
      }],
    };
    vi.mocked(fetchGameSummary).mockResolvedValue(summary);
    vi.mocked(normalizeGameSummary).mockReturnValue({});
    render(
      <HockeyGameTile
        game={{
          id: 'nhl-game',
          league: 'NHL',
          status: { type: 'STATUS_IN_PROGRESS', period: 5, altDetail: 'SO' },
          awayTeam: { id: 'away-team', abbreviation: 'OTT' },
          homeTeam: { id: 'home-team', abbreviation: 'NYI' },
          situation: { lastPlay: 'Live play' },
        }}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetchGameSummary).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchGameSummary).toHaveBeenCalledTimes(2);
  });
});