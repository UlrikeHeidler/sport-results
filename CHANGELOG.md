# Changelog

All notable changes to this project are documented in this file.

## [Unreleased] - 2025-10-27

### Fixed
- Emit GAME_UPDATED when only the sport-specific `situation` object changes (down/distance, balls/strikes/outs, powerplay, SOG, etc.). This ensures UI additional-info panels update in real time.

### Added
- Unit tests for incremental updates manager covering situation-only updates.
- Integration tests (jsdom) for football, baseball, and hockey tiles to verify additional-info sections re-render when `game` props update.
- Hook-level integration test for `useIncrementalUpdates` to assert manager → hook → UI propagation.

### Other
- Defensive cloning in incremental manager and small test environment mocks to make tests deterministic.

---

Please run the test suite locally before opening a PR:

```
npm install
npm run test:ci
```

If everything is green, create a PR with this changelog included and reference the incremental updates and UI fixes.
