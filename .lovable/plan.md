## Plan

1. **Fix the visible “Failed to load promotions” state**
   - Update the account-page promotions component so load errors no longer render as a red failure message.
   - For empty/no-access/no-promotions states, show the friendly “No bounty promotions yet” empty state for all users.
   - Keep real errors logged for debugging.

2. **Fix the backend access rule causing the failure**
   - Replace the `campaign_subscriptions` and `campaign_clicks` policies that depend on custom JWT fields (`x_user_id`, `wallet_address`).
   - Use the existing `rei_registry` identity records instead, matching the logged-in auth user to their registered X identity/wallet.
   - Add the missing Data API grants for `campaign_subscriptions`, `campaign_clicks`, `tasks`, and `rei_registry` so the app can actually read them.

3. **Assign API/RSS bounties to @wayneanthonyd**
   - Add a `source` field to `campaign_subscriptions` and a tracked-promotion reference on `tasks` if needed.
   - Backfill every existing aggregated/API/RSS bounty into a Wayne-owned promotion record.
   - Generate a unique short tracking code for each one.
   - Attach each task to its Wayne promotion record.

4. **Automatically track future API/RSS bounties**
   - Add a database trigger so any future non-user bounty added through existing import/sync means automatically creates or reuses a Wayne-owned promotion record.
   - This excludes bounties submitted by other users.

5. **Wrap API/RSS bounty links through Rei tracking**
   - Update bounty card components so aggregated/API/RSS bounty “view/apply” links use `/c/<short_code>` when available.
   - Keep the original external link as a fallback if no tracking code exists.

6. **Keep rewards fair**
   - Update the campaign click tracking function so aggregated/platform-owned promotions record click analytics but do **not** award user reward points.
   - User-paid promotions keep their normal points/rewards behavior.

## Technical notes

- The current failure is not just an empty-state issue: the policies still reference custom JWT claims that are not present in normal logged-in sessions.
- The database currently shows aggregated tasks exist, but none are linked to campaign subscriptions yet.
- The implementation will use a migration for policy/schema/trigger changes, then code edits after the migration is approved and types regenerate.