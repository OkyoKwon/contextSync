# Design System

ContextSync frontend design system. Based on Tailwind CSS 4 + CSS custom properties, dark-first theme. Primary body font is Inter (`font-sans`), code/monospace uses JetBrains Mono (`font-mono`).

---

## 1. Color Tokens

All colors are defined as CSS custom properties, toggling Dark/Light via the `data-theme` attribute.

### Theme Variables

| Token                       | Dark (default)          | Light                  |
| --------------------------- | ----------------------- | ---------------------- |
| `--color-page`              | `#141414`               | `#F9FAFB`              |
| `--color-surface`           | `#1C1C1C`               | `#FFFFFF`              |
| `--color-surface-hover`     | `#252525`               | `#F3F4F6`              |
| `--color-surface-sunken`    | `#111111`               | `#F3F4F6`              |
| `--color-text-primary`      | `#FAFAFA`               | `#111827`              |
| `--color-text-secondary`    | `#D4D4D8`               | `#374151`              |
| `--color-text-tertiary`     | `#A1A1AA`               | `#6B7280`              |
| `--color-text-muted`        | `#71717A`               | `#9CA3AF`              |
| `--color-border-default`    | `#27272A`               | `#E5E7EB`              |
| `--color-border-input`      | `#3F3F46`               | `#D1D5DB`              |
| `--color-btn-primary-bg`    | `#FAFAFA`               | `#2563EB`              |
| `--color-btn-primary-text`  | `#141414`               | `#FFFFFF`              |
| `--color-btn-primary-hover` | `#E4E4E7`               | `#1D4ED8`              |
| `--color-interactive-hover` | `#27272A`               | `#F3F4F6`              |
| `--color-focus`             | `#3B82F6`               | `#2563EB`              |
| `--color-error`             | `#EF4444`               | `#DC2626`              |
| `--color-error-muted`       | `#F87171`               | `#EF4444`              |
| `--color-error-bg`          | `rgb(239 68 68 / 0.15)` | `rgb(220 38 38 / 0.1)` |
| `--color-link`              | `#60A5FA`               | `#2563EB`              |
| `--color-link-hover`        | `#93BBFD`               | `#1D4ED8`              |
| `--color-nav-active-bg`     | `rgb(59 130 246 / 0.1)` | `rgb(37 99 235 / 0.1)` |
| `--color-nav-active-text`   | `#60A5FA`               | `#2563EB`              |

### Semantic Color Palette

Colors used for badges, status indicators, etc. Pattern: `{color}-500/15` background + `{color}-400` text.

| Usage            | Background      | Text         |
| ---------------- | --------------- | ------------ |
| Info (blue)      | `blue-500/15`   | `blue-400`   |
| Success (green)  | `green-500/15`  | `green-400`  |
| Warning (yellow) | `yellow-500/15` | `yellow-400` |
| Critical (red)   | `red-500/15`    | `red-400`    |
| Default (gray)   | `zinc-500/15`   | `zinc-400`   |

---

## 2. Typography

- **Body font:** Inter (`font-sans`) — primary UI font (weights: 400, 500, 600, 700)
- **Mono font:** JetBrains Mono (`font-mono`) — code blocks, technical content (weights: 400, 500, 600, 700)
- **CSS vars:** `--font-sans: "Inter", ...`, `--font-mono: "JetBrains Mono", ...`
- **Size scale:** `text-xs` → `text-sm` → `text-base` → `text-lg` → `text-xl`
- **Heading scale:**
  - **h1 (Page title):** `text-2xl font-bold text-text-primary`
  - **h2 (Section title):** `text-lg font-semibold text-text-primary`
  - **h3 (Card title):** `text-sm font-semibold uppercase tracking-wider text-text-tertiary`
  - **h4 (Subsection):** `text-sm font-medium text-text-secondary`
- **Common combinations:**
  - Body: `text-sm text-text-secondary`
  - Label: `text-sm font-medium text-text-tertiary`
  - Title: `text-xl font-bold text-text-primary`
  - Auxiliary: `text-xs text-text-muted`

---

## 3. Spacing & Layout

### AppLayout Structure

```
┌──────────────────────────────────────────────┐
│ flex h-screen bg-page font-mono              │
│ ┌─────────┬──────────────────────────────┐   │
│ │ Sidebar │ Header (h-14, px-6)          │   │
│ │ (w-60)  ├──────────────────────────────┤   │
│ │         │ main (flex-1, p-6)           │   │
│ │         │   <Outlet />                 │   │
│ │         │                              │   │
│ └─────────┴──────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

- **Sidebar:** `w-60` (240px) expanded, `w-16` (64px) collapsed, `bg-surface`, right border. Includes `ProjectSelector`, `CreateProjectModal`, and `JoinProjectDialog` for project management.
- **Header:** `h-14` (56px), `bg-surface`, bottom border, `px-6`
- **Content:** `flex-1 overflow-y-auto p-6`

### Border Radius Rules

| Usage                | Class                        |
| -------------------- | ---------------------------- |
| Card                 | `rounded-xl`                 |
| Button, Input, Modal | `rounded-lg`                 |
| Badge, Avatar        | `rounded-full`               |
| NavLink, list items  | `rounded-lg` or `rounded-md` |

### Common Spacing

- Padding: `p-3` (small areas), `p-4` (card default), `p-6` (page content)
- Gap: `gap-1` ~ `gap-6`

---

## 4. Component Catalog

All UI components: `apps/web/src/components/ui/`

### Button

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
```

| Variant     | Style                                         |
| ----------- | --------------------------------------------- |
| `primary`   | btn-primary-bg/text, theme-inverted color     |
| `secondary` | surface-hover background, zinc ring           |
| `danger`    | red-600 background, red-700 hover             |
| `ghost`     | transparent, text-tertiary, interactive-hover |

| Size | Class                         |
| ---- | ----------------------------- |
| `sm` | `px-3 py-1.5 text-sm`         |
| `md` | `px-4 py-2 text-sm` (default) |
| `lg` | `px-6 py-3 text-base`         |

Common: `inline-flex items-center justify-center rounded-lg font-medium`, disabled: `opacity-50 cursor-not-allowed`.

### Card

```typescript
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

| Padding | Class           |
| ------- | --------------- |
| `none`  | none            |
| `sm`    | `p-3`           |
| `md`    | `p-4` (default) |
| `lg`    | `p-6`           |

Common: `rounded-xl border border-border-default bg-surface`. Supports className passthrough.

### Badge

```typescript
interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: 'default' | 'info' | 'warning' | 'critical' | 'success';
}
```

`<span>` based, `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium`. Semantic color palette applied.

Helper: `SeverityBadge({ severity })` — auto-maps severity string to variant.

### Input

```typescript
// forwardRef supported
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

- `label`: top label (`text-sm font-medium`)
- `error`: bottom error message (`text-red-400`), border changes to red
- `block w-full rounded-lg`, focus: `ring-focus`
- Error state: `border-error`, `aria-invalid`, `aria-describedby` for accessibility
- disabled: `bg-surface-hover text-muted`

### Select

```typescript
// forwardRef supported
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
```

- Same styling pattern as Input: `block w-full rounded-lg`, focus: `ring-focus`
- `label`: top label, `error`: bottom error message with `aria-invalid`/`aria-describedby`
- disabled: `bg-surface-hover text-muted`

### PageLayout

```typescript
interface PageLayoutProps {
  readonly children: ReactNode;
  readonly maxWidth?: 'sm' | 'md' | 'lg' | 'xl'; // default: 'md'
  readonly className?: string;
}
```

Common page wrapper: `mx-auto max-w-{size} space-y-6 p-6`. Replaces repeated inline layout classes across pages.

### Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}
```

- Overlay: `fixed inset-0 bg-black/70 z-50`
- Dialog: `max-w-lg bg-surface border rounded-xl z-10`
- Closes via ESC key or outside click
- ARIA: `role="dialog"`, `aria-modal="true"`

### Tooltip

```typescript
interface TooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
  width?: string; // default: w-56
  children?: ReactNode; // renders InfoIcon if absent
}
```

- Displayed via `group-hover`/`group-focus-within`
- `backdrop-blur`, `rounded-lg border`, `text-xs leading-relaxed`
- `z-50`, opacity transition

### Avatar

```typescript
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}
```

| Size | Class                       |
| ---- | --------------------------- |
| `sm` | `h-6 w-6 text-xs`           |
| `md` | `h-8 w-8 text-sm` (default) |
| `lg` | `h-10 w-10 text-base`       |

- If `src` provided: `<img>` (rounded-full, object-cover)
- Otherwise: displays initials (blue-500/15 background, blue-400 text)

### Spinner

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}
```

| Size | Class               |
| ---- | ------------------- |
| `sm` | `h-4 w-4`           |
| `md` | `h-6 w-6` (default) |
| `lg` | `h-8 w-8`           |

SVG based, `animate-spin`, uses `currentColor`. Includes `role="status"` and `aria-label` for screen reader accessibility. Optional `label` prop (default: "Loading").

### Icons

Exported from `icons.tsx`. Base `Icon` component provides `size` prop (default 20px).

**Available icons:** `CalendarIcon`, `TrendingUpIcon`, `WarningIcon`, `UsersIcon`, `CheckCircleIcon`, `ZapIcon`, `DollarIcon`, `CpuIcon`, `FolderIcon`, `InfoIcon`, `FileIcon`, `CrownIcon`

All use 24x24 viewBox, stroke-based (Feather style), `currentColor`.

### ErrorBoundary

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
```

React class component. On error, displays warning icon + error message + "Try Again"/"Reload Page" buttons. Supports custom `fallback` prop.

### ApiErrorBoundary (ErrorDisplay)

```typescript
interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}
```

API error display component. `red-500/30` border, `red-500/10` background, optional retry button.

### ProgressBar

```typescript
interface ProgressBarProps {
  readonly value: number;
  readonly max?: number; // default: 100
  readonly label?: string;
  readonly showPercentage?: boolean; // default: true
}
```

Horizontal progress bar with optional label and percentage display. `h-2 rounded-full bg-accent-primary` fill with transition animation.

### StepWizard

```typescript
interface Step {
  readonly id: string;
  readonly label: string;
}

interface StepWizardProps {
  readonly steps: readonly Step[];
  readonly currentStepId: string;
}
```

Multi-step wizard indicator. Shows numbered circles with connector lines. Active step: `bg-accent-primary text-white`, completed: checkmark icon with `bg-accent-primary/20`, pending: `bg-bg-tertiary`.

### EmptyState

```typescript
interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}
```

Centered empty state display with optional icon, title, description, and action slot. `py-20`, `text-lg font-semibold` title.

### Skeleton

```typescript
interface SkeletonProps {
  readonly className?: string;
}
```

Loading placeholder. `animate-pulse rounded bg-surface-hover`. Size controlled via `className` passthrough (e.g., `h-4 w-32`).

### BrowserFrame

```typescript
interface BrowserFrameProps {
  readonly children: ReactNode;
  readonly className?: string;
}
```

Browser chrome UI wrapper with macOS-style traffic light dots (red/yellow/green). `rounded-xl border border-border-default bg-surface`.

### ScreenshotImage

```typescript
interface ScreenshotImageProps {
  readonly src: string;
  readonly alt: string;
  readonly fit?: 'cover' | 'contain'; // default: 'cover'
  readonly className?: string;
}
```

Lazy-loaded image (`loading="lazy" decoding="async"`). `rounded-lg`, fit controlled by `object-cover` | `object-contain`.

### MarkdownRenderer

```typescript
interface MarkdownRendererProps {
  readonly content: string;
  readonly className?: string;
}
```

Theme-aware Markdown renderer using `react-markdown` + `remark-gfm`. Applies `prose prose-sm max-w-none`, auto-applies `prose-invert` in dark mode.

---

## 5. Theme System

### Flow

```
Zustand (useThemeStore)
  → localStorage ('context-sync-theme')
  → useThemeSync() hook
    → document.documentElement.setAttribute('data-theme', theme)
      → CSS custom properties switch
```

### Implementation

**Store** (`stores/theme.store.ts`):

```typescript
type Theme = 'dark' | 'light';

interface ThemeState {
  readonly theme: Theme;
  toggleTheme: () => void;
}
```

- Persisted to localStorage via Zustand `persist` middleware
- Default: `dark`

**Hook** (`hooks/use-theme.ts`):

```typescript
export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}
```

- Called in `App.tsx` to sync DOM attribute

**Toggle** (ThemeToggle in `Header.tsx`):

- Dark mode: sun icon (click to switch to Light)
- Light mode: moon icon (click to switch to Dark)

---

## 6. Component Patterns

### Record-based Variant Mapping

```typescript
const variantStyles: Record<Variant, string> = {
  primary: '...',
  secondary: '...',
  danger: '...',
  ghost: '...',
};

// Usage
className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
```

Consistently applied across all variant/size components.

### forwardRef

Form elements (Input, etc.) support ref forwarding via `forwardRef`:

```typescript
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => { ... }
);
```

### className Passthrough

All components accept external `className` for style extension:

```typescript
<Card className="mt-4" padding="lg">...</Card>
```

### HTML Attribute Spread

Native HTML attributes forwarded via `...props` pattern:

```typescript
<button {...props} className={computedClassName}>
```

---

## 7. Naming Conventions

| Target              | Rule                            | Example                                                    |
| ------------------- | ------------------------------- | ---------------------------------------------------------- |
| Component files     | PascalCase.tsx                  | `Button.tsx`, `ErrorBoundary.tsx`                          |
| Icons               | `<Name>Icon`                    | `CalendarIcon`, `InfoIcon`                                 |
| CSS tokens          | `--color-{category}-{modifier}` | `--color-text-primary`, `--color-surface-hover`            |
| Hook files          | kebab-case.ts                   | `use-theme.ts`, `use-projects.ts`                          |
| Store files         | kebab-case.store.ts             | `theme.store.ts`, `auth.store.ts`                          |
| Tailwind references | `{category}-{token}`            | `bg-surface`, `text-text-primary`, `border-border-default` |

---

## 8. Accessibility & Interaction

- **Focus ring:** `focus:ring-2 focus:ring-offset-2 focus:ring-offset-page`
- **Hover transitions:** `transition-colors` (most interactive elements)
- **ARIA:** Modal (`role="dialog"`, `aria-modal`), Tooltip (`role="tooltip"`), buttons (`aria-label`)
- **Keyboard:** Modal closes on ESC
- **Keyboard Shortcuts:** `Cmd+K` (search/command palette)
- **Z-Index:** Modal/Tooltip `z-50`

---

## 9. Settings Page Architecture

Settings page uses a sidebar tab navigation layout (`SettingsLayout`).

### Tab Configuration (`settings-tabs.ts`)

| Tab ID         | Label        | Content Component |
| -------------- | ------------ | ----------------- |
| `general`      | General      | `GeneralTab`      |
| `team`         | Team         | `TeamTab`         |
| `integrations` | Integrations | `IntegrationsTab` |
| `danger-zone`  | Danger Zone  | `DangerZoneTab`   |

Default tab: `general`. Tab selection persisted via `?tab=` query parameter.

### Settings Components (`components/settings/`)

- **`SettingsLayout.tsx`** — Main layout with sidebar tab list + content area
- **`GeneralTab.tsx`** — Project name/description editing, Claude plan, API key management
- **`TeamTab.tsx`** — Collaborator list, join code management (`JoinCodeShare`), team setup CTA
- **`IntegrationsTab.tsx`** — Supabase onboarding, remote DB setup
- **`DangerZoneTab.tsx`** — Project deletion
- **`JoinCodeShare.tsx`** — Join code display, copy, regenerate, delete
- **`TeamSetupCta.tsx`** — CTA for inviting team members
