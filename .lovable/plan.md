# Fix "Connect Wallet" doing nothing on /rei Promote tab

## Symptom
On `/rei` → Promote tab, clicking the **Connect Wallet** button in `PostToRei` does nothing — no modal opens, no error toast.

## Root cause
The console shows this warning, repeated on every render:

> Phantom was registered as a Standard Wallet. The Wallet Adapter for Phantom can be removed from your app.

`src/components/WalletProvider.tsx` registers `new PhantomWalletAdapter()` explicitly:

```ts
const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
```

Modern Phantom auto-registers via the Wallet Standard, so `@solana/wallet-adapter-react` filters the legacy `PhantomWalletAdapter` out of the wallet list. Result: the `wallets` array ends up effectively empty, so `WalletMultiButton` has nothing to show — clicking it opens a modal with no installable wallets, or in some versions no-ops entirely. That matches "nothing happens".

A secondary contributor: the in-progress walkthrough spotlight overlay (fixed-position, high z-index) can also intercept pointer events on top of the modal if a tour is mid-flight. We'll verify but the primary fix is the wallet list.

## Fix

### 1. Stop registering the legacy Phantom adapter
Edit `src/components/WalletProvider.tsx`:
- Remove `PhantomWalletAdapter` import + entry.
- Pass `wallets={[]}` to `SolanaWalletProvider`. The Standard Wallet auto-discovery picks up Phantom (and Solflare, Backpack, etc.) automatically.
- Keep `autoConnect={false}` as today.

### 2. Sanity-check the modal actually opens
After the change, clicking **Connect Wallet** should open the standard Solana wallet modal listing Phantom. If it still doesn't, fall back to driving the modal directly via `useWalletModal().setVisible(true)` inside `PostToRei`, bypassing `WalletMultiButton`'s internal click handler entirely.

### 3. Walkthrough overlay z-index check
Confirm `WalkthroughTour`'s backdrop doesn't sit above the wallet modal. If it does, raise the modal's z-index (`.wallet-adapter-modal-overlay`, `.wallet-adapter-modal`) in `src/index.css` so it always wins.

## Files touched
- `src/components/WalletProvider.tsx` — remove `PhantomWalletAdapter`, use empty wallets array
- `src/index.css` — only if z-index conflict is confirmed
- `src/components/PostToRei.tsx` — only if step 2 fallback is needed

No backend, schema, or copy changes.
