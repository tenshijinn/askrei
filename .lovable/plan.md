

# Rei — Standalone AI Agent Platform

Extract the complete Rei AI Agent platform from the Arubaito project into this standalone app, preserving all design, functionality, and backend integration.

## What We're Building

A standalone Rei platform with the same dark "manga" terminal-inspired UI, featuring:
- **Rei registration flow** — Twitter/X OAuth login, wallet connect, audio intro recording, role selection, profile analysis
- **AskRei chatbot** — Terminal-style AI chat for job/task discovery with Solana payment integration
- **PostToRei** — Submit jobs, tasks, gigs, and bounties with SOL/x402 payments
- **Earnings Hub** — Points display, referral system, wallet tracking
- **JoinRei landing page** — Marketing/onboarding page with all sections (hero, value prop, aggregation, how it works, chat demo, referral, pricing)

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | JoinRei landing page (marketing/onboarding) |
| `/rei` | Main Rei app (registration → dashboard with AskRei/Promote/Profile tabs) |

## Key Components to Migrate

**Core pages:** `Rei.tsx`, `JoinRei.tsx`

**Components:**
- `ReiChatbot.tsx` — Terminal-style AI chat with message history, presets, payment handling
- `PostToRei.tsx` — Opportunity submission form
- `ReiEarningsHub.tsx` — Points & earnings display
- `AudioRecorder.tsx` — Voice intro recording
- `JobCard.tsx`, `TalentCard.tsx` — Result cards
- `SolanaPayQR.tsx`, `X402Payment.tsx`, `PaymentMethodSelector.tsx` — Payment components
- `ReiPointsCard.tsx`, `ReferralShareCard.tsx`, `ReferralStats.tsx` — Gamification
- `WalletProvider.tsx`, `EVMWalletProvider.tsx` — Blockchain wallet providers
- All `chat/` sub-components and `joinrei/` section components

**Styling:** Full `rei-theme` CSS system (terminal, chips, surfaces, fields, cursors) plus the Arubaito base theme as dark mode default

**Assets:** All `rei-*` images and `joinrei/` assets

## Backend (Supabase Edge Functions)

All Rei-related edge functions will be copied over:
- `rei-chat` — Main AI chat handler (1700+ lines, intent classification, job search, talent matching)
- `submit-rei-registration`, `check-rei-registration`, `analyze-rei-profile`
- `twitter-oauth` — X/Twitter authentication
- `submit-whitelist-request`, `approve-whitelist-submission`
- `search-jobs`, `match-jobs-to-talent`, `match-talent-to-jobs`
- `verify-sol-payment`, `verify-solana-pay`, `x402-create-payment`, `x402-verify-payment`
- `generate-referral-code`, `get-referral-stats`, `track-referral-click`, `track-referral-conversion`
- `award-payment-points`, `submit-community-opportunity`
- `analyze-cv`, `transcribe-video` — Profile analysis tools
- `_shared/` utilities

## Database Migrations

All existing Supabase migrations will be brought over to maintain the same schema (chat tables, registrations, jobs, tasks, payments, referrals, points, etc.)

## Dependencies to Add

- `@solana/wallet-adapter-*`, `@solana/web3.js`, `@solana/pay` — Solana integration
- `@rainbow-me/rainbowkit`, `wagmi`, `viem` — EVM wallet support
- `qrcode`, `bs58`, `x402-solana` — Payment utilities
- `html2canvas`, `jspdf`, `pdfjs-dist` — Document handling

## Key Changes from Original

- **No Arubaito references** — All branding, routes, and navigation will be Rei-only
- **`/` route** → JoinRei landing (was `/joinrei`)
- **`/rei` route** → Main app (unchanged)
- **Standalone Supabase connection** — Same backend secrets, own project config
- **Simplified App.tsx** — Only Rei-related routes, no Club/Community/Admin/etc.

