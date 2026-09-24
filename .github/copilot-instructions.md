# Copilot Instructions for `brandon-portfolio`

## Project Snapshot
- This is a Create React App project (`react-scripts` 5) with React 19 and a very small surface area.
- The app boots from `src/index.js`, which renders `<App />` into `#root` from `public/index.html`.
- `src/App.js` is currently the single UI entry point; `src/App.css` and `src/index.css` hold the app and global styles.

## Architecture and Flow
- Treat this as a client-side portfolio site: there is no API layer, router, state store, or backend integration in the current codebase.
- Keep shared, page-wide CSS in `src/index.css`; keep component-scoped styles in `src/App.css` or in future component-specific CSS files.
- `src/reportWebVitals.js` is optional telemetry wiring and can stay untouched unless performance reporting is explicitly needed.

## Current Code Patterns
- Follow the existing CRA import order and simple function-component style used in `src/App.js`.
- Prefer direct JSX composition over adding abstractions unless the UI grows enough to justify separate components.
- The current test in `src/App.test.js` uses React Testing Library and Jest DOM; update or replace it when the rendered UI changes.

## Development Workflow
- Start the app with `npm start` and validate production output with `npm run build`.
- Use `npm test` for the watch-mode test runner; CRA’s default test setup is already wired through `src/setupTests.js`.
- Keep changes compatible with the CRA ESLint config in `package.json` (`react-app`, `react-app/jest`).

## Public Assets and HTML
- Add static assets under `public/` when they need to be served directly by CRA.
- Update `public/index.html` only for document-level metadata, not for app structure.

## When Editing
- Preserve the minimal, portfolio-site structure unless the user asks for a larger refactor.
- If you add a new component, place it under `src/` and wire it from `App.js`; keep naming consistent with CRA conventions.
- If you change the visible UI, make the test in `src/App.test.js` assert the new user-facing content rather than the default "learn react" link.
