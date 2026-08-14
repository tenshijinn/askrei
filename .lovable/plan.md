# Reorder home-page parallax sections

Reorder the full-screen parallax/section sequence on the landing page (`/`) to match the requested order and drop the two sections that no longer fit.

## Current sequence
1. `ScrollVideoHero` (split video scroll)
2. `HomeValueProp` (Earn Points & Rewards)
3. `HomeAggregation` (Find Tasks from Across...)
4. `HomeDemoSection` (onboarding/chat/post-task mockups)
5. `HomeAgentTabs` (Your AI Agent KOL / AskRei Bounty Chatbot)
6. `HomeDiamondScore` (Your Diamond Score gets you paid)
7. `HomeReferral` (Earn Solana for Sharing Tasks on Socials)

## New sequence
1. `ScrollVideoHero` — unchanged split video scroll parallax
2. `HomeAggregation` — "Find Tasks from Across (rotator text)"
3. `HomeAgentTabs` — "Your AI Agent KOL / AskRei Bounty Chatbot"
4. `HomeDiamondScore` — "Your Diamond Score gets you paid."
5. `HomeReferral` — "Earn Solana for Sharing Tasks on Socials."
6. `HomeHowItWorks` — "How to Use."

## Implementation
- Edit `src/pages/JoinReiV2.tsx` to:
  - Remove imports for `HomeValueProp` and `HomeDemoSection`.
  - Add import for `HomeHowItWorks`.
  - Render sections in the new order: `ScrollVideoHero`, `HomeAggregation`, `HomeAgentTabs`, `HomeDiamondScore`, `HomeReferral`, `HomeHowItWorks`.
- No changes to the individual components themselves.
- Verify the home page renders correctly and `snap-y` snap points still align.
