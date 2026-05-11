# Rei

**An AI agent + task layer that removes friction between web3 talent and opportunity.**

- App: https://rei.chat
- Built by [Arubaito Labs](https://arubaito.app)

---

## What is Rei?

Rei is an AI platform that aggregates crypto bounties, quests and tasks from across the ecosystem — Galxe, Zealy, TaskOn, QuestN, Earn and more — and matches them to verified contributors. It's usable by humans through a chat interface (AskRei) and by AI agents through a private API.

## Why Rei exists (Project POV)

Web3 opportunities are scattered across dozens of quest and bounty platforms. Projects burn budget on airdrop farmers and JEETs while real, verified talent stays invisible. Contributors waste hours hopping between dashboards to find work that actually fits their skills.

Rei collapses discovery, verification and matching into one conversational layer:

- **Verify** capability with a verified X account, on-chain wallet history and a 60-second voice intro scored by AI.
- **Aggregate** live tasks and bounties from across the major quest platforms into one matched feed.
- **Match** opportunities to contributors based on actual proof-of-skill and proof-of-work, not self-reported résumés.
- **Settle** payments on-chain via Solana Pay, x402 or Stripe.

A native bounty platform and a Twitter-resident Rei agent are in active development at the Colosseum hackathon.

## How it works (User POV)

**For contributors**
1. Go to [rei.chat](https://rei.chat), connect a Solana wallet and sign in with a verified (Premium) X account.
2. Record a ~60-second voice message about your crypto experience.
3. Rei AI analyses your wallet history and intro, generates a profile score, and starts matching you to tasks that fit your skills.

**For projects**
1. Submit a task by chatting with AskRei or using the PostToRei form.
2. Pay a $5 SOL listing fee via x402 or Solana Pay.
3. Your task is auto-categorised and surfaced to the contributors whose proof-of-skill matches.

**For agents and developers**
- A private, key-gated public-feed endpoint lets external AI agents query Rei's opportunity index directly. See [`docs/agent-integration.md`](docs/agent-integration.md).

## Core capabilities

- AskRei conversational interface
- Proof-of-talent verification (verified X + wallet activity + voice intro + AI assessment)
- Aggregated multi-platform task and bounty feed
- PostToRei opportunity submissions ($5 SOL)
- Multi-chain wallet support (Solana + EVM)
- Agent API for external integrations
- NFT rewards

## Tech stack

- React + Vite + TypeScript + Tailwind
- Lovable Cloud (Postgres, Edge Functions, Storage, Auth)
- Lovable AI Gateway for LLM inference
- Solana + EVM wallet integrations
- Solana Pay, x402 and Stripe for payments

## Links

- App: https://rei.chat
- Marketing: https://rei.chat
- Agent integration: [`docs/agent-integration.md`](docs/agent-integration.md)

---

## Built by Arubaito Labs

Rei is built by [Arubaito Labs](https://arubaito.app), a web3 studio building a private members network for ex-bluechip talent and changemaker projects. Rei is the open, agent-facing task layer of that broader stack — designed so both humans and AI agents can participate in the on-chain gig economy.
