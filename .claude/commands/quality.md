# /quality — AI-Assisted Code Quality Review

Run a structured quality review on the code you are about to write, have just written, or on an explicitly named file/feature. Pass `--fix` to apply all findings automatically; without it, report findings and ask before changing anything.

## How to invoke

- `/quality` — review the current working diff or most recent change
- `/quality <file-or-feature>` — review a specific file or feature area
- `/quality --fix` — review and apply all fixes without prompting

---

## Step 1 — Understand scope before writing a single line

Before implementing anything new:

1. **Search for existing functionality** using Grep and Glob. Look for:
   - Functions, hooks, utilities, or components that already solve the same problem (even partially)
   - Similar patterns elsewhere in the codebase you should follow
   - Constants, config, or types that already model the domain

2. **Decide: enhance or create new?**
   - If existing code covers ≥ 60% of the need, extend it — don't duplicate
   - If the existing implementation would require significant restructuring to extend cleanly, a new well-named module is better
   - Document the decision in your response before writing code

3. **Check dependencies** — if a new library seems needed, first verify:
   - Does the standard library cover it?
   - Does an already-installed package (check `package.json`) cover it?

---

## Step 2 — Implement with clean architecture

Apply these rules to every change:

**Structure**
- One responsibility per function/component — if you need "and" to describe what it does, split it
- Keep side effects at the boundaries (API calls, localStorage, DOM) — pure logic in the middle
- Prefer editing existing files over creating new ones
- Don't add abstractions for hypothetical future use — only what the current task requires

**Error handling**
- Validate at system boundaries only (user input, external API responses)
- Trust internal code and framework guarantees — don't add defensive checks for things that can't happen
- Match the error handling pattern used in surrounding code

**Dead code**
- Don't leave unused variables, unreachable branches, or props that are passed but never consumed
- If removing something is out of scope for this task, note it explicitly rather than silently leaving it

---

## Step 3 — Write unit tests for every change

For each function, hook, or component you add or modify:

1. **Identify the contract** — what inputs map to what outputs/side effects?
2. **Write tests that cover:**
   - The happy path (normal expected input)
   - Edge cases (empty, null, boundary values, unexpected types)
   - Failure paths (what happens when it goes wrong)
3. **Place tests** in the nearest `__tests__` directory following the existing naming convention (e.g. `foo.test.js` alongside `foo.js`)
4. **Run the full test suite** after writing — confirm no regressions:
   ```
   npm test -- --watchAll=false
   ```
   If tests fail that you did not touch, report them before proceeding.

**Test quality rules:**
- Test behaviour, not implementation — don't assert on internal state or private function calls
- Each test should have one reason to fail
- Don't mock what you own; mock at the boundary (external APIs, browser APIs, timers)

---

## Step 4 — Add comments only where they earn their place

**Add a comment when:**
- The WHY is non-obvious (a hidden constraint, a workaround for a known bug, a subtle invariant)
- A future reader would be surprised or confused without it
- You are intentionally deviating from the surrounding pattern

**Do NOT add a comment when:**
- The code already reads clearly from well-named identifiers
- You are describing WHAT the code does (the code itself says that)
- You are noting the current task, PR, or caller ("added for the pin feature", "used by App.jsx")

Good: `// ESPN reports period=5 during shootouts; map to a readable label instead of "Period 5"`
Bad: `// Loop through games and sort them`

---

## Step 5 — Final checklist before reporting complete

Go through this list and confirm each item explicitly in your response:

- [ ] Searched for existing functionality — decision to reuse/extend/create documented
- [ ] No new dependency added without justification
- [ ] Single responsibility per new function/component
- [ ] Error handling matches the pattern at the correct layer
- [ ] No dead code introduced
- [ ] Unit tests written and passing for all new/modified code
- [ ] No regressions in the existing test suite
- [ ] Comments added only where the WHY is non-obvious
- [ ] `--fix` mode: all findings applied; `advisory` mode: findings listed, awaiting approval

---

## If `--fix` was NOT passed (advisory mode)

Report findings grouped by severity:

**Must fix** — bugs, broken contracts, missing tests for changed behaviour
**Should fix** — duplicated logic that should reuse existing code, missing error boundary
**Consider** — architectural suggestions, naming improvements, dead code

For each finding: file path + line number, one-sentence description, suggested fix.
Then ask: *"Apply all findings, apply selected findings, or skip?"*
