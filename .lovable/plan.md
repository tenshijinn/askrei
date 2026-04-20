

## Add "Rei Flow + Telegram CRM Outreach" parallax to /joinrei

Port the full uploaded `Flow.tsx` design as a new full-viewport snap section, slotted between `JoinReiDemoSection` and `JoinReiReferral`.

### Layout (from the uploaded file)

```text
                    REI FLOW (4 phones, connected horizontally)
   ┌───────┐ ──► ┌───────┐ ──► ┌───────┐ ──► ┌───────┐
   │PACKAGE│     │LISTED │     │SKILL- │     │  ICP  │
   │ $2500 │     │ Live  │     │ SYNC  │     │ MATCH │
   └───┬───┘     └───▲───┘     └───────┘     └───┬───┘
       │             │                           │
       │ L-shape     └──── loop back ────────────┘
       ▼ (yellow)               (telegram blue)
   ─────────────  TELEGRAM CRM OUTREACH  ─────────────
   ┌───────┐         ┌───────┐                ┌───────┐
   │ONBOARD│         │  CRM  │                │APPLIC.│
   │TG blue│         │(TEAM) │                │  847  │
   └───────┘         └───────┘                └───────┘
                  ●━━━━ ● ● ● ●   step indicator
```

7 phone mockups total, two rows, with animated SVG connectors and a 5-step auto-cycling active state (3s interval).

### Implementation

**Create `src/components/joinrei/JoinReiFlowDiagram.tsx`** — single self-contained component porting the uploaded `Flow.tsx` with these adaptations:

1. **Replace `motion/react` → `framer-motion`** (already in project, used elsewhere). All `<motion.div>`, `<motion.path>`, `<motion.polygon>` JSX stays identical.
2. **Keep `lucide-react` icons** (Eye, Send, User, Target, Briefcase, ArrowRight, MessageSquare, CheckCircle, Users) — already a project dep.
3. **Keep all inline `style={{}}` colors verbatim** — the design uses its own palette (`#e8c4b8` cream-pink, `#FFD700` gold, `#0088cc` Telegram blue, `#0a0a0a`/`#111` dark). These read well on Rei's existing dark background and shouldn't be re-skinned (the file is intentionally multi-color to distinguish Rei vs Telegram flows).
4. **Wrap in snap section**: outer `<section className="min-h-screen snap-start flex items-center justify-center bg-[#0a0a0a]">` to match other JoinRei sections, replacing the file's `min-h-screen p-8 flex items-center justify-center` wrapper.
5. **Responsive scaling**: the design is fixed-width (1800px max, 180px phones, hardcoded SVG coords like `M 290 402`). On screens below `lg`, scale the entire diagram down with a CSS `transform: scale()` wrapper rather than re-laying-out (preserves SVG arrow alignment). Below `md`, hide the cross-row SVG arrows and stack the two rows vertically with extra gap.
6. **Auto-cycle**: keep the `useState`/`useEffect` 3s `setInterval` driving `activeStep` 0→4.
7. **`PhoneMockup` and `ConnectionLine`** stay as internal sub-components inside the same file (matches uploaded structure).

**Edit `src/pages/JoinRei.tsx`** — import and insert the new section:

```tsx
import { JoinReiFlowDiagram } from '@/components/joinrei/JoinReiFlowDiagram';
// ...
<JoinReiDemoSection />
<JoinReiFlowDiagram />   {/* new */}
<JoinReiReferral />
```

### Discarded / out of scope

- Uploaded Tailwind v4 configs, `theme.css`, `fonts.css` — not used; we keep Rei's existing v3 setup.
- No re-skin to `#ed565a` — the diagram's two-color story (cream-pink for Rei, Telegram blue for the outreach loop) is the whole point. Confirm if you want this overridden.
- No new assets — every icon is inline `lucide-react`.

### Files

- **Create**: `src/components/joinrei/JoinReiFlowDiagram.tsx`
- **Edit**: `src/pages/JoinRei.tsx`

