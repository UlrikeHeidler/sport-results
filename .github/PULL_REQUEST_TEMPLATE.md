<!-- Provide a short description of the change and the problem this solves -->
## Summary

This PR includes a set of fixes and tests to ensure real-time situational data (e.g., football down/distance, baseball balls/strikes/outs, hockey SOG/powerplay) is propagated to the UI.

## What I changed
- Incremental updates manager now emits GAME_UPDATED when `situation` changes.
- Added unit tests for the manager and integration tests (jsdom) for football, baseball, hockey tiles.
- Added a hook-level test for `useIncrementalUpdates`.
- Added CHANGELOG.md and test:ci script.

## How to test
1. Install dev deps: `npm install`
2. Run tests: `npm run test:ci`

All tests are expected to pass in CI. The test suite includes unit and integration tests that run under jsdom.

## Notes
- This PR is strictly additive (tests + small detection logic). No breaking API changes.
