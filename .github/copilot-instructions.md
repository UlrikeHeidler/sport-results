# Sports Results App AI Development Guide

This document provides essential knowledge for AI agents to effectively work with the Sports Results React application.

## Project Architecture

- **Frontend Only**: Pure React application using Vite as build tool, no backend required
- **Data Source**: Fetches live sports data from ESPN API endpoints (see `services/sportsApi-fixed.js`)
- **State Management**: Uses React hooks and local storage for settings persistence
- **Component Structure**:
  - `App.jsx`: Main application container with core game fetching/filtering logic
  - `components/GameTile.jsx`: Individual game display with animations
  - `components/LeagueSelector.jsx`: League filtering UI
  - `components/Settings.jsx`: User preferences modal

## Key Workflows

### Development

```bash
npm run dev    # Start dev server at port 3000
npm run build  # Build for production
npm run preview # Preview production build
```

### Dependency Management

- React 18+ with hooks
- `react-beautiful-dnd` for drag-and-drop game tile reordering
- `vite` for build and development tooling

## Project Conventions

### Component Patterns

1. **Game Data Handling**
   - Game data is fetched and normalized in `sportsApi-fixed.js`
   - Common game status types: `STATUS_IN_PROGRESS`, `STATUS_SCHEDULED`, `STATUS_HALFTIME`

2. **UI Updates & Animations**
   - Score/status changes trigger animations via CSS classes
   - Games move to bottom 2 minutes after completion
   - Live games are prioritized in sorting

### Data Flow

1. **Game Data Pipeline**:
   ```
   ESPN API → fetchAllGames() → parseGamesData() → 
   App state → filtering/sorting → GameTile components
   ```

2. **Settings Flow**:
   ```
   User Input → Settings component → localStorage → 
   App settings state → UI updates
   ```

### Integration Points

1. **ESPN API Integration** (`services/sportsApi-fixed.js`):
   - Base URL: `https://site.api.espn.com/apis/site/v2/sports`
   - Supported leagues: NFL, NHL, FCS, FBS, MLB, Bundesliga 1/2
   - Error handling returns empty arrays instead of throwing

2. **Local Storage**:
   - Used for persisting user preferences
   - Key: `sportsAppSettings`
   - Stores refresh interval, league selection, team visibility

## Common Tasks

### Adding a New League

1. Add league endpoint in `API_ENDPOINTS` object in `sportsApi-fixed.js`
2. Add league colors in `getLeagueColors()`
3. Add league info in `LeagueSelector` component
4. Update default settings in both `App.jsx` and `Settings.jsx`

### Modifying Game Display

1. Update `GameTile.jsx` component
2. Add/modify CSS classes in `index.css`
3. Consider animation timing with state updates

### Data Transformation Examples

```javascript
// Converting ESPN API game data
{
  id: event.id,
  league: league.toUpperCase(),
  status: {
    type: competition.status.type.name,
    displayClock: competition.status.displayClock || '',
    period: competition.status.period || 0,
    completed: competition.status.type.completed || false
  },
  // ... team data
}
```

## Debugging Tips

1. Check browser console for detailed API fetch logging
2. Game state updates trigger animations - check component mounting/unmounting
3. Local storage issues often affect settings persistence

## File Structure Reference

```
src/
  components/
    GameTile.jsx      # Individual game display
    LeagueSelector.jsx # League filtering
    Settings.jsx      # User preferences
  services/
    sportsApi-fixed.js # API integration and data handling
  App.jsx             # Main application logic
  index.css           # Global styles
  main.jsx           # Entry point
```