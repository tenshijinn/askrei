## Add private `/registered` lookup to public-feed

Extend the existing `public-feed` edge function with one new endpoint that lets Rei (and only Rei / holders of a valid agent API key) check whether an X user has a rei.chat account.

### Endpoint

```
GET /public-feed/registered?x_user_id=<id>
GET /public-feed/registered?handle=<handle>   (optional, case-insensitive)
```

Auth (same as every other public-feed route — nothing new to share with Hermes):
- `Authorization: Bearer <SUPABASE_ANON_KEY>`
- `apikey: <SUPABASE_ANON_KEY>`
- `x-api-key: rei_live_…` (paid agent key) **or** an entry in `REI_AGENT_API_KEYS` (internal — this is what Rei will use)

Response (privacy-safe — no wallet, no file_path, no analysis JSON):
```json
{
  "registered": true,
  "x_user_id": "1234567890",
  "handle": "someuser",
  "display_name": "Some User",
  "verified": true,
  "has_profile_analysis": true,
  "registered_at": "2026-03-12T10:00:00Z"
}
```
If not found: `{ "registered": false }` (200, not 404 — easier for the agent to branch on).

### What changes

1. **`supabase/functions/public-feed/index.ts`** — add a `registered` route handler:
   - Require `x-api-key` (reuse the existing key-validation path that already gates `/tasks`, `/jobs`, etc.).
   - Validate query: at least one of `x_user_id` or `handle` (zod or manual).
   - Use the service-role client (already in scope) to query `rei_registry` by `x_user_id` (exact) or `handle` (ilike).
   - Return only the whitelisted fields above. Never return `wallet_address`, `file_path`, `profile_analysis`, `nft_mint_address`, `portfolio_url`, etc.
   - Log to `agent_api_usage` like the other endpoints.

2. **`docs/agent-integration.md`** — add the new endpoint to the table + a short example.

3. **`src/components/agents/AgentsEndpoints.tsx`** — add one row so the marketing page stays in sync ("8 endpoints" instead of 7). *(Optional — say the word if you'd rather keep this endpoint undocumented publicly so only Rei knows about it.)*

### Privacy / security guarantees

- **No new database changes.** RLS on `rei_registry` stays exactly as-is; anonymous public reads remain blocked. The endpoint reads via service role inside an edge function that requires a valid agent key.
- **Whitelist-by-field**, not blacklist — handler explicitly picks the fields to return, so accidental schema additions can't leak.
- **Internal-only mode**: because Rei will use a key from `REI_AGENT_API_KEYS` (already a project secret), no public/paid agent ever needs to know this endpoint exists. If you want to make it *strictly* Rei-only and reject paid `rei_live_…` keys, the handler can additionally check that the key came from `REI_AGENT_API_KEYS` rather than `agent_api_keys` table — confirm and I'll add that gate.

### Open question

Want me to:
- **(a)** allow any valid agent key (paid + internal), or
- **(b)** restrict `/registered` to internal `REI_AGENT_API_KEYS` only (Rei-only)?

Default is (b) based on "make sure it's private and can only be exposed to our agent" — I'll go with (b) unless you say otherwise.
