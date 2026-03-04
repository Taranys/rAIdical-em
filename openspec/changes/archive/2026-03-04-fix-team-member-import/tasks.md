## 1. Investigation and Root Cause

- [x] 1.1 Reproduce the bug in a browser: open the app, navigate to Team, open Import sheet, select a user, click Import — confirm nothing happens
- [x] 1.2 Check browser DevTools console for errors and Network tab for outgoing requests when clicking Import
- [x] 1.3 Identify the root cause (event propagation, Radix Dialog interference, silent promise rejection, or state issue)

## 2. Fix Implementation

- [x] 2.1 Fix the Import button click handler in `src/app/team/import-github-sheet.tsx` based on root cause findings
- [x] 2.2 Add explicit `type="button"` to the Import button to prevent any accidental form submission behavior
- [x] 2.3 Wrap the import handler with error catching at the onClick level so unhandled errors are surfaced to the user

## 3. Testing

- [x] 3.1 Update unit tests in `src/app/team/import-github-sheet.test.tsx` to cover the error visibility scenario
- [x] 3.2 Manually verify the fix in the browser: select users, click Import, confirm loading state, API calls, and results display
- [x] 3.3 Run the full test suite to confirm no regressions
