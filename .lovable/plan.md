## Goal

When a registered user returns to `/rei` and signs in, take them straight into the app. Never show the "Activate AI Agent" card again for users who already have a profile in `rei_registry`, whether or not they currently follow @AskRei_.

## Change

In `src/pages/Rei.tsx`, inside the `checkExistingRegistration` effect (around line 115), when a registration row is found for the signed-in X account, treat that as sufficient to enter the app:

- Set `initialFollowing` to `true` immediately (no follow check required).
- Remove the background `twitter-oauth` `checkFollow` call added in the previous step — it's no longer needed for this gating.

That flips the gate at `Rei.tsx:291` (`isSuccess && registrationData && !isEditMode && (initialFollowing || profileActivated)`) to true on load, so the logged-in view renders instead of the Activate card.

New users (no `rei_registry` row) are unaffected — they still go through the full Activate flow as today.

## Notes

- No changes to `ActivateReiProfileCard` or the follow-check edge function.
- No banner, no locked features, no re-follow prompt — the user answered "Let them in silently".
- The `initialFollowing` state name becomes slightly misleading (it now really means "skip activation"), but renaming is cosmetic and out of scope.
