I found why it still looks broken: the previous fix normalized the URL shape, but it also pinned one bad Superteam row to the wrong slug. The database currently has a task titled “Explain Defunds Finance” pointing at the Kimia Protocol Superteam page, so the format is valid but the destination is wrong.

Plan:

1. Fix the bad existing Superteam records
   - Update any known mismatched Superteam rows, starting with:
     - “Explain Defunds Finance” -> `https://superteam.fun/earn/listing/explain-defunds-finance`
   - Re-check all Superteam links in the database after the update for non-canonical patterns.

2. Harden the Google Drive sync so this does not happen again
   - Improve `normalizeSuperteamUrl` to support these incoming variants:
     - `https://earn.superteam.fun/listings/<slug>`
     - `https://earn.superteam.fun/listing/<slug>`
     - `https://superteam.fun/listings/<slug>`
     - `https://superteam.fun/listing/<slug>`
     - `https://superteam.fun/earn/listings/<slug>`
     - `https://superteam.fun/earn/listing/<slug>`
   - Always output the working canonical format:
     - `https://superteam.fun/earn/listing/<slug>`
   - Preserve query/hash only if needed, but never preserve the broken plural `/listings/` route.

3. Add a safer fallback for Superteam rows with bad/missing slugs
   - If the provided URL slug looks wrong or unusable, generate a likely slug from the task title and use `/earn/listing/<title-slug>` as the fallback.
   - This would have prevented “Explain Defunds Finance” from being pointed at the Kimia listing.

4. Deploy and run the sync
   - Deploy the updated `sync-drive-tasks` backend function.
   - Trigger it once so the latest Google Drive file is re-imported with corrected Superteam links.

5. Verify the result
   - Query the task database for all Superteam rows.
   - Confirm there are no `earn.superteam.fun/listings`, `/listings/`, or `/listing/` root-path leftovers.
   - Spot-check representative Superteam URLs to confirm they resolve instead of 404ing.