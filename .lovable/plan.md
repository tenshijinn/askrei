## Update the zkPFP bounty

Target row in `tasks` (id `e9926925-9cc6-4bd3-b5c0-d3e30061d63e`, source `unlimited-posts`, status `active`).

### Field changes
- `title` → `Mint a zkPFP on zkProf`
- `description` → `Create and mint your zkPFP on zkProf to establish your on-chain identity and showcase your participation in the zk ecosystem. Once completed, submit proof of your mint to qualify for the reward.`
- `compensation` → `$5` (currently NULL)
- `link` → `https://zkprof.xyz` (currently the forbidden `arubaito.app` URL — fixes a branding-policy violation too)

### How
One `UPDATE` on `public.tasks` scoped to that id via the insert tool. No schema/migration, no edge function or frontend changes. Public feed/Hermes contract unaffected (same columns).

### Verification
Re-`SELECT` the row to confirm the four fields, and check `/rei` shows the updated card.