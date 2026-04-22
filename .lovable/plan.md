

## Animate the 3 Mockups in HomeDemoSection

Bring the three mockups (Onboarding, Chat with Rei, Post Tasks) to life so users can see each flow happen automatically when the section enters view.

### What changes

**Mockup 1 — Proof of Humanity / Onboarding**
- Step indicator advances `1 → 2 → 3` over time (active pill highlights in accent red).
- "Sign in with X" button briefly shows a hover/press state, then a green check appears next to it.
- "Connect Wallet" button does the same, then shows a truncated wallet address (`7xKn…9pQ2`).
- Role pills toggle on one by one (`Dev → Design → Community`), pulsing accent border as each activates.
- Voice intro pill animates a small waveform for a couple of seconds.

**Mockup 2 — Chat with Rei**
- Messages appear sequentially with a typing indicator (3 bouncing dots) between each:
  1. Rei: "Hey! I found 3 tasks…"
  2. Task cards fade/slide in one by one
  3. You: "Show me the Galxe quest details"
  4. Rei: "Sure! Here's the breakdown…"
  5. Final Rei message: link + reward (`galxe.com/quest/dao-activation • 0.5 SOL + 250 XP`)
- The input bar shows a blinking caret while idle.

**Mockup 3 — Post Tasks**
- Type pills cycle: `Job → Task → Bounty → Quest`, settling on Bounty.
- Form fields type in their values character-by-character (Title, Company, Description, Compensation) with a blinking caret.
- Role tags pop in one at a time.
- "Pay 5 USDC & Post" button pulses subtly, then briefly switches label to "Posted ✓" in green before resetting.

**Loop behaviour**
- Each mockup runs its own short loop (~8–12s), then resets and replays. Loops are independent so they don't feel synced/robotic.
- Animations only run while the section is in the viewport (IntersectionObserver), and pause when out of view to save CPU.
- Respects `prefers-reduced-motion`: falls back to a single static "final state" view (current behaviour) for users who opt out.

### Scope
- Update `src/components/joinrei/HomeDemoSection.tsx` only — adds local state + small reusable hooks (`useTypewriter`, `useStepCycle`) inside the component file or a small helper alongside it.
- No new dependencies. Pure React state + CSS transitions and existing Tailwind animation utilities (`animate-fade-in`, `animate-pulse`).
- `JoinReiDemoSection.tsx` (used on `/joinrei`) is **not** changed in this pass — the request was for `/` only. Happy to mirror it there next if you want.

### Technical notes
- Single `IntersectionObserver` at the section level toggles an `isActive` boolean passed to each mockup.
- Each mockup is extracted into its own internal sub-component (`OnboardingMockup`, `ChatMockup`, `PostTaskMockup`) for clean state isolation — no change to the outer grid, headings, or `ScrollFadeIn` wrappers.
- All timings tuned so a full cycle fits comfortably while the user dwells on the section; nothing flashes faster than ~250ms.

