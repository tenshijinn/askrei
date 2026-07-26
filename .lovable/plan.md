## Goal

Two coupled changes on the signup/signin flow at `/rei`:

1. **Following @AskRei_ becomes a suggestion, not a gate.** After X sign-in, users go straight to the wallet step. The follow prompt is preserved as an optional nudge.
2. **Introduce agent integrations as first-class connect options** on the same screen — X (primary) plus ChatGPT, Claude, Cursor, and other MCP clients as secondary suggestions.

## Current behavior (verified)

- `src/pages/Rei.tsx` (line 584) gates step 2 behind `profileActivated || initialFollowing`. Until the user follows `@AskRei_` (polled via `twitter-oauth/checkFollow`) or clicks through the 3-step `ActivateReiProfileCard`, wallet connect is disabled/dimmed.
- The Activate card owns three "steps": Verified X ✓ → Follow @AskRei_ → Unlock. Follow is the only real gate; the other two are decoration.
- MCP server already exists (`.lovable/mcp/manifest.json` at `/functions/v1/mcp`, OAuth-protected) with `search_bounties`, `search_jobs`, etc. So "use Rei from ChatGPT/Claude" is real and shippable today.

## Proposed UI (single new card replaces `ActivateReiProfileCard` after X sign-in)

Rename mental model: from "Activate your Rei profile" (blocker) → **"Connect Rei to your workflow"** (menu of suggestions the user can act on now or skip). Structure:

```text
┌─────────────────────────────────────────────────────────┐
│  ✓ Signed in as @handle · Verified                      │
├─────────────────────────────────────────────────────────┤
│  Recommended · make Rei work harder for you             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [X logo]  Follow @AskRei_ on X       [Follow →]  │   │ ← primary, pulsing (existing style)
│  │ Get bounty DMs, daily posts, tag for Q&A          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Or use Rei from your AI assistant                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ ChatGPT  │ │  Claude  │ │  Cursor  │ │  Copy    │    │ ← secondary tiles
│  │ Connect →│ │ Connect →│ │ Connect →│ │ MCP URL  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                          │
│              [ Continue to wallet setup → ]              │ ← always enabled
└─────────────────────────────────────────────────────────┘
```

Behavior:
- **Not blocking.** "Continue to wallet setup" is always enabled — advancing sets `profileActivated = true` locally and unlocks step 2 immediately.
- **Follow card** keeps the existing heartbeat pulse + intent-follow URL + auto-poll via `twitter-oauth/checkFollow`. If the poll detects a follow, the tile flips to a green "Following ✓" state but does NOT auto-advance (user is already free to move on).
- **AI assistant tiles** each open the appropriate deep link in a new tab:
  - ChatGPT → `https://chatgpt.com/` with a "Copy MCP URL" fallback (ChatGPT still requires manual paste in Settings → Connectors for most users; we show a one-click "Copy MCP URL" toast).
  - Claude → `https://claude.ai/settings/connectors` (deep link to connector settings).
  - Cursor → `cursor://anysphere.cursor-deeplink/mcp/install?name=rei&config=...` (Cursor's documented MCP install deep link).
  - "Copy MCP URL" tile always visible for any other client — copies `https://rei.chat/functions/v1/mcp` to clipboard.
- The two marquees currently in `ActivateReiProfileCard` (`Activate for Rewards`, `Activate for Functions`) collapse into short helper copy under the Follow tile — the marquees are cute but they read as gatekeeping.
- The 3-step "Verified → Activate → Unlock" progress bar (the `CELLS`-based cell bar and 66→100% progression) is removed. The 3-dot step bar at the top of the whole page already communicates progress; a second progress bar for a now-optional step is misleading.

## Returning users

`initialFollowing` still influences the flow (already-following users see the "Following ✓" tile pre-lit), but no branch treats non-followers differently — same card, same continue button.

## Data & backend

- **No schema changes.** `follows_askrei` continues to be read from `twitter-oauth` and stored on the profile row (useful analytics: what % of registrants follow).
- **No MCP changes.** Manifest is already deployed. New tiles are pure frontend deep links / clipboard copies.
- `twitter-oauth/checkFollow` polling stays but is optional — only started when the user clicks the Follow tile, and cancelled when they hit "Continue".

## Files touched

- `src/pages/Rei.tsx` — replace the `!profileActivated && !initialFollowing` branch (line 584) with the new card; remove the `initialFollowing` gate from step 2's condition (line 601) so wallet section becomes available as soon as `twitterUser` exists.
- `src/components/rei/ActivateReiProfileCard.tsx` — rewrite as `ConnectReiCard.tsx` (new name reflects new intent). Keep the pulse-follow button, drop the linear progress bar, marquees, and step-3 "unlock" animation. Add MCP tiles + Continue button.
- `src/components/rei/mcpConnectTiles.tsx` (new, small) — the 4 tiles + deep-link URLs + copy-to-clipboard helper. Keeping this separate makes it reusable on the account/profile page later.
- No changes to `twitter-oauth` edge function or MCP manifest.

## Copy (draft, editable)

- Section header: **"Connect Rei to your workflow"** · *"All optional — skip and set up later from your profile."*
- Follow tile: **"Follow @AskRei_ on X"** · *"Get high-paying bounties DM'd to you, daily posts, and tag @AskRei_ anywhere for tailored answers."*
- MCP header: **"Use Rei inside your AI assistant"** · *"Rei speaks MCP — plug it into ChatGPT, Claude, Cursor, or any MCP-compatible client."*
- Continue: **"Continue → Connect wallets"**

## Verification

- Sign up with a fresh X account that does NOT follow @AskRei_ → new card appears, Continue button is enabled from the start, clicking it advances to wallet step.
- Sign up with an X account that already follows → follow tile shows "Following ✓" pre-lit, same Continue behavior.
- Click Follow tile → opens x.com intent in new tab, tile shows "Checking… Ns", and if a follow is detected the tile updates without changing wallet-step accessibility.
- Click each AI tile → correct deep link opens / URL copied to clipboard (toast confirms).
- Reload mid-flow → user still sees the card until they click Continue; no forced re-follow.
- Grep confirms no other code path treats `follows_askrei` as a gate.

## Out of scope

- Editing the MCP manifest, adding new MCP tools, or changing OAuth flow.
- Changing the follow requirement anywhere else (e.g. leaderboards, chat features) — this plan only touches the registration/sign-in card.
- Persisting per-user "which AI assistants did they connect" analytics (can be added later as a follow-up).
