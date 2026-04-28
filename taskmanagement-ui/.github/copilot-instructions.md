# TaskManagement UI - Copilot Instructions

## Project Overview

**Task Management UI** is a React 19 frontend built with Create React App that manages projects and tasks. It connects to a backend API at `http://localhost:5267/api`.

- **Stack**: React 19, React Router 7, Axios, Testing Library 16
- **Build**: `npm start` (dev), `npm run build` (prod), `npm test` (Jest)
- **Architecture**: Page-based routing (Dashboard, Projects, Tasks) with centralized API client

## Code Organization

```
src/
├── App.js              # Root component with Router
├── pages/              # Page components (Dashboard, Projects, Tasks)
├── routes/             # AppRoutes: navigation & route definitions
├── services/api.js     # Axios client (baseURL: http://localhost:5267/api)
├── index.js            # Entry point
└── App.css, index.css  # Global styles (inline styles preferred in components)
```

## Key Patterns & Conventions

### State Management
- **Local component state only** — Use `useState` for form inputs, UI toggles, data lists
- **No global state library** — If adding shared state, consider React Context or keep it minimal
- **Data fetching**: Use `useState` + `useEffect` → axios calls → setData/setError/setLoading

### API Integration
- **Import**: `import api from "../services/api"`
- **Pattern**: `api.get('/endpoint')`, `api.post('/endpoint', payload)`, etc.
- **Errors**: Wrap in try/catch; set error state and log: `console.error('Endpoint failed:', err)`
- **Loading states**: Always set loading before fetch, clear after success or error

### Component Structure
- **Functional components only** (no class components)
- **Props drilling acceptable** for small project scope
- **No error boundaries yet** — Add `<ErrorBoundary>` wrapper if adding complex child components
- **Styling**: Use inline `style={}` objects; avoid CSS Modules or Tailwind (not in deps)

### Forms
- **Pattern**: `useState` per field (e.g., `const [name, setName] = useState('')`)
- **Validation**: Basic client-side validation before submit; show alerts for errors
- **Reset**: Clear state after successful submit

### Testing
- **Framework**: Jest + React Testing Library
- **Status**: `App.test.js` has invalid test ("learn react link" doesn't exist) — **fix or remove immediately**
- **Pattern**: Query by role/label; use `waitFor` for async operations
- **Setup**: `setupTests.js` only extends jest-dom matchers

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `npm start` fails with exit code 1 | Run `npm test` to see failing tests; fix/remove `App.test.js` invalid test |
| API calls not updating UI | Ensure `useEffect` dependency array is correct; check network tab for 5267 backend |
| Form not submitting | Verify `state` values are set; add `console.log` in submit handler |
| Async race conditions | Track `useRef` abort controllers or check `isMounted` before setState |

## Development Workflow

### Before Coding
1. Confirm backend is running on port 5267
2. Run `npm start` → verify no test failures
3. Check API contract in backend (endpoint paths, expected request/response)

### Writing Features
1. **New page**: Create `src/pages/NewPage.js` → add route in `AppRoutes.js` → add nav link
2. **New API call**: Use centralized `api` client; wrap in try/catch; manage loading/error/data state
3. **Form**: Use `useState` per field; submit handler calls API; show success/error feedback

### Testing
- Write tests for **page** components (not leaf components yet)
- Use `render()`, `screen.getByRole()`, `waitFor()`, `userEvent`
- Mock API calls if needed: `jest.mock('../services/api')`

## Before Committing

- [ ] `npm test` passes (no failing tests)
- [ ] `npm start` runs without errors
- [ ] Console has no warnings or errors
- [ ] Loading states display while fetching
- [ ] Error messages are user-friendly (no raw error dumps)

## Next Priorities

1. **Fix or remove broken test** in `App.test.js`
2. **Add error boundary** to wrap page routes
3. **Standardize async patterns** with loading/error states
4. **Document API contract** (endpoints, payloads, error codes)
5. **Extract form logic** if forms grow (consider custom hook)

## Ask Me About

- Specific API endpoint paths/responses (check backend swagger or logs)
- Component composition for new features
- Testing async operations with mocked APIs
- Refactoring state management as project grows
