
# Add EVM wallet at registration (Solana stays primary, wallets are locked once set)

Users optionally connect an EVM wallet during registration so its on-chain history feeds Rei's Diamonds alongside Solana. Solana remains the sole payout wallet. **Wallets cannot be changed after registration** — deleting the account is the only way to re-link.

## Invariants (SVM-favorability)

- **Solana wallet** — required. Powers payments, points, referrals, campaign attribution, MCP `whoami`, Solana Pay/x402, all `wallet_address` FKs. Unchanged.
- **EVM wallet** — optional, enrichment only. Feeds Alchemy/Blockscout/Moralis-EVM into the Diamond Score. Never used for payouts, points, or identity.
- **Account identity** stays keyed on `x_user_id`. `rei_registry.wallet_address` continues to mean Solana.
- **Ownership** of the EVM address is proven implicitly by the wagmi/RainbowKit connect handshake (the wallet extension only exposes addresses whose keys it controls). No extra signature step.
- **Once registered, wallets are locked.** No "Change wallet" affordance anywhere. To change, the user deletes their account (existing `delete-rei-account` flow) and re-registers.
- **Diamond Score** merges signals from both chains when present. Confidence gate already down-weights sparse data.

## Data model

Migration on `rei_registry`:
- add `evm_wallet_address text null`
- unique partial index on `evm_wallet_address` where not null (prevents one EVM wallet padding multiple accounts)
- no ownership-sig columns (dropped per feedback)

## Frontend (`src/pages/Rei.tsx` + wallet cards)

Registration step 2 becomes two stacked cards:

**Card A — Connect Solana Wallet** (required, unchanged mechanics)
**Card B — Connect EVM Wallet (optional)** — RainbowKit `ConnectButton.Custom` styled to match Card A.

Add a shared, minimal explainer above both cards:

> "Rei reads your wallets' public on-chain history to score your reputation (Diamond Score). Connecting an EVM wallet alongside your Solana wallet gives Rei a fuller picture of your activity — more accurate score, better bounty matches. **Payouts always go to your Solana wallet.** Wallets are locked once you register, so choose the ones that best represent you."

Rules:
- Card B never blocks submission; `canSubmit` still gates on Solana + roles + consent only.
- **Remove all "Change wallet" UI** — both the existing Solana change flow and any EVM equivalent. In edit mode, wallet cards render as read-only "Linked" chips with no button. `showWalletChange` state and its handlers are deleted.
- Include `evm_wallet_address` in the submit payload only on initial registration. Edit-mode submissions never touch either wallet field.

## Edge functions

`submit-rei-registration/index.ts`:
- Accept `evm_wallet_address` on initial registration; ignore it on reanalyze/edit.
- On upsert, only write `evm_wallet_address` when the existing row has none (guard against overwrite even if the client sends it).
- Pass both addresses to `analyze-rei-profile`.

`analyze-rei-profile/index.ts`:
- When `evmWalletAddress` is present, run Moralis-EVM + Alchemy + Blockscout in parallel with the Solana providers.
- Merge normalized signals from both chains before `computeDiamonds` (sum tx_count/swap_count, union protocol/collection sets, min account-age for confidence). Small merger helper in `_shared/diamonds/`.
- Record every provider hit in `wallet_behaviour.providers_used`.

`rescan-diamond-scores/index.ts`:
- Select `evm_wallet_address` too; when present, run EVM providers, merge with Solana signals, write updated score. This is the ongoing "rescore as behavior evolves" path.

`delete-rei-account/index.ts`:
- No change — already deletes the whole row, which clears both wallet fields.

## Out of scope

- No payment/points/referral/MCP changes.
- No per-chain Diamond badge — single score.
- No wallet-change UI. Removing the existing Solana "Change wallet" affordance is part of this change.

## Files touched

- Migration: new file under `supabase/migrations/`
- `src/pages/Rei.tsx` (add EVM card, add explainer, remove change-wallet UI/state)
- `src/integrations/supabase/types.ts` (auto-regen)
- `supabase/functions/submit-rei-registration/index.ts`
- `supabase/functions/analyze-rei-profile/index.ts`
- `supabase/functions/rescan-diamond-scores/index.ts`
- `docs/reis-diamonds.md` (document dual-chain ingestion + locked-wallet policy)

## Verification

- Register fresh with Solana only → score unchanged from today.
- Register fresh with both wallets → `wallet_behaviour.providers_used` includes EVM providers; score reflects merged signals.
- Edit-mode UI shows both wallets as read-only, no Change button anywhere.
- Attempt to submit an edit payload with a different `wallet_address` or `evm_wallet_address` → server ignores it.
- Rescan endpoint recomputes scores for accounts with both wallets attached.
- Grep confirms `evm_wallet_address` appears only in registration/analysis/rescan paths — nowhere in payment, points, or referral code.
