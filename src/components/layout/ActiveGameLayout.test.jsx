import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActiveGameLayout from './ActiveGameLayout';

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => <div>{children}</div>,
  Droppable: ({ children }) => children({
    droppableProps: {},
    innerRef: vi.fn(),
    placeholder: null
  })
}));

vi.mock('../game-tiles/GameTileFactory', () => ({
  default: ({ game }) => <div data-testid="game-tile">{game.id}</div>
}));

vi.mock('../detail/DetailPane', () => ({
  default: ({ game }) => <div data-testid="detail-pane">{game.id}</div>
}));

const game = (id, league = 'NHL') => ({
  id,
  league,
  homeTeam: { id: `${id}-home`, name: 'Home', record: null },
  awayTeam: { id: `${id}-away`, name: 'Away', record: null }
});

const makeProps = (overrides = {}) => ({
  filteredGames: [],
  settings: {
    selectedLeagues: ['NHL'],
    refreshInterval: 30,
    colorCoding: true,
    showTeamForm: true
  },
  loading: false,
  error: null,
  useIncrementalMode: true,
  updateFrequency: '30s',
  liveGamesCount: 0,
  onForceRefresh: vi.fn(),
  recordsOverlay: {},
  pinnedIds: new Set(),
  activeDetailKeys: [],
  togglePin: vi.fn(),
  isInDetailMode: vi.fn(() => false),
  toggleDetailMode: vi.fn(),
  onRecordsUpdate: vi.fn(),
  ...overrides
});

describe('ActiveGameLayout', () => {
  it('renders the loading state and refresh information', () => {
    render(<ActiveGameLayout {...makeProps({ loading: true })} />);

    expect(screen.getByText(/Loading games/)).toBeInTheDocument();
    expect(screen.getByText(/Smart updates: 30s/)).toBeInTheDocument();
  });

  it('shows an empty-state message when no games are available', () => {
    render(<ActiveGameLayout {...makeProps()} />);

    expect(screen.getByText('No games scheduled')).toBeInTheDocument();
  });

  it('renders games not shown in the detail pane alongside a selected detail pane', () => {
    render(<ActiveGameLayout {...makeProps({
      filteredGames: [game('one'), game('two')],
      activeDetailKeys: ['NHL-one']
    })} />);

    expect(screen.getByTestId('detail-pane')).toHaveTextContent('one');
    expect(screen.getByTestId('game-tile')).toHaveTextContent('two');
  });
});
