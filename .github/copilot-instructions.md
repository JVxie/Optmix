# Copilot Instructions for OptmixCalculator

## Project Overview
**OptmixCalculator** is a React + Vite web app for raw material mix optimization. It solves cost-minimization problems where materials must be blended to meet target indicator ranges (e.g., protein %, moisture %). Built with TypeScript, uses `javascript-lp-solver` for linear programming and `xlsx` for Excel import/export.

## Architecture

### Core Data Model (`types.ts`)
- **Indicator**: Quality metric (name, unit, min/max constraints) - e.g., "蛋白质" (protein) 18-25%
- **Material**: Ingredient with price and indicator values - e.g., "原料A" (Material A) ¥2000/ton, protein 20%
- **Scenario**: Collection of indicators + materials forming one optimization problem; supports persistence
- **OptimizationResult**: Solver output with material ratios (%) and final cost/ton

Key pattern: All data keyed by `id` (strings), indicator values in materials via `Record<id, value>`

### Component Hierarchy
- **App.tsx**: Global state (scenarios, active scenario, view mode), localStorage persistence, scenario CRUD
- **Sidebar.tsx**: Scenario list, rename/delete/import/export (Excel), hamburger toggle for mobile
- **ConfigurationView.tsx**: Orchestrates setup - switches between IndicatorManager & MaterialManager
- **CalculationView.tsx**: Displays current state, hosts Optimizer, ManualAdjuster, shows saved results
- **Optimizer.tsx**: Calls solver service, renders pie chart + indicator compliance table, passes result up
- **IndicatorManager/MaterialManager**: CRUD for indicators/materials with validation, inline edit/delete, Modal confirmation
- **ManualAdjuster.tsx**: Manual ratio input (alternative to solver), persists to scenario
- **Modal.tsx**: Reusable confirmation dialog
- **Sidebar mobile behavior**: Closes on scenario switch or import action

### Services

**`solver.ts`** (`calculateOptimalMix`)
- Builds LP model: minimize cost s.t. total = 100%, indicators within [min×100, max×100]
- Uses CDN-sourced `javascript-lp-solver` (npm: javascript-lp-solver 0.4.24)
- Returns `OptimizationResult` with success flag, cost, material ratios (%), and message
- Handles infeasibility gracefully with user-friendly error messages

**`excelService.ts`**
- **Export**: Two sheets (指标管理, 货物管理) with timestamp in filename
- **Import**: Parses Excel, validates structure/data, maps indicator names → IDs, returns Scenario
- Error handling: Rejects with descriptive Chinese messages for missing sheets/invalid data

## Key Patterns & Conventions

### State Management
- **No Redux/Zustand**: All state in App.tsx, passed via props and callbacks
- **Immutable updates**: Use `map()` to transform state, never mutate directly
- **Persistence**: Auto-save to localStorage on scenarios change; Scenario stores manual ratios & optimization result separately

### Event Flow Pattern
Example: Update indicator in ConfigurationView
1. User submits form in IndicatorManager
2. Calls `onChange` callback with new indicators[]
3. ConfigurationView passes to App via updateActiveScenario() callback
4. App updates state → localStorage auto-save

### Validation & Errors
- Check for empty/duplicate names across all managers (Sidebar, IndicatorManager, MaterialManager)
- Show errors inline in Modal dialogs, prevent submission until valid
- Solver returns `success: false` with message instead of throwing

### Form Input Styling
Use `inputClass` constant (found in IndicatorManager): `"w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500..."`

### Mobile Responsiveness
- Grid layout with `lg:` breakpoints (Optimizer chart uses `grid-cols-1 lg:grid-cols-2`)
- Sidebar toggle via hamburger (Menu icon from lucide-react)
- Sidebar closes on mobile after scenario actions

## Development Workflow

### Commands
- `npm run dev`: Start Vite on port 3000 (configured in vite.config.ts)
- `npm run build`: Production build to dist/
- `npm run preview`: Preview build locally
- `npm install`: Install dependencies

### Build Configuration
- **Vite** (v6.2.0) with React plugin (@vitejs/plugin-react)
- **TypeScript** ~5.8.2, strict mode
- **Port**: 3000, host 0.0.0.0 (allows remote access)
- **Alias**: `@` → project root (rarely used here)

### Adding Features
1. **New UI**: Create component in `components/`, accept data via props, emit changes via callbacks
2. **New Data Type**: Extend `types.ts`, update `Scenario` interface if persisting
3. **New Service**: Add to `services/`, export pure functions, handle errors explicitly
4. **LocalStorage**: App.tsx already syncs scenarios; add custom fields to Scenario if needed

### Testing Approach
No test suite yet. Manual testing:
- Create/rename/delete scenarios
- Add 2+ indicators and materials with diverse values
- Test solver feasibility (adjust ranges if infeasible)
- Export scenario to Excel, reimport to verify round-trip
- Mobile: test sidebar toggle and layout at small viewport

## Integration Points

- **Excel I/O**: Browser FileReader API, XLSX library parses/writes binary
- **Solver**: CDN-based JS LP solver (npm installed, no build-time compilation needed)
- **Icons**: lucide-react (Menu, Plus, Trash2, Edit2, etc.)
- **Charts**: recharts PieChart in Optimizer (responsive, shows material ratios)

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Solver returns infeasible | Expand indicator min/max ranges or add more diverse materials |
| Scenario data lost | Check localStorage permissions; verify App.tsx useEffect on scenarios change |
| Excel import fails | Verify sheet names are exactly "指标管理" and "货物管理"; check columns exist |
| Form won't submit | Check for empty/duplicate names; validation errors show in Modal |
| Chart labels overlap | Recharts handles responsively; on mobile, consider reducing font size |

---
**Last Updated**: 2026-01-28  
**Main Entry**: App.tsx | **Types**: types.ts | **Solver Logic**: services/solver.ts
