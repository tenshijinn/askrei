# Referral attribution end-to-end

## Goal
Make referral attribution observable across the full journey:

```text
/r/:code click
  ├─ signup/registration conversion
  ├─ package purchase conversion
  └─ booking-link click conversion
```

Keep the existing referral code, click, and conversion records as the source of truth, with separate conversion types so registrations, payments, and bookings can be counted independently.

## Current findings
- Referral landing links write `referral_code` and `referral_session_id` to browser storage and call `track-referral-click`.
- The live database currently has referral codes, but zero referral clicks and zero referral conversions.
- Registration does not currently carry the stored referral attribution or create a registration conversion.
- The existing conversion function referenced by the x402 payment verifier is not present in the project, so that payment conversion path cannot complete.
- Stripe checkout metadata does not currently include referral attribution, and the payment webhook only handles the subscription record.
- The Join Rei booking button opens the booking URL directly and does not record a referral-aware booking event.
- The conversion table currently permits only `registration` and `payment`, so booking needs an explicit type.

## Implementation
1. Add a shared referral-attribution helper for browser flows that safely reads the stored code/session and keeps the original referral across the signup and package pages without replacing it on unrelated navigation.
2. Add a `track-referral-conversion` backend function that:
   - validates the referral code and active status;
   - resolves the matching click by referral code/session where available;
   - records an idempotent conversion with `registration`, `payment`, or `booking` type;
   - awards referral points only once per conversion event;
   - does not trust a caller-supplied promoter identity.
3. Update registration completion to pass the referral attribution and record a registration conversion against the newly registered wallet.
4. Thread referral attribution into package checkout metadata and record a payment conversion from the verified Stripe completion path. Also pass attribution through the existing x402 flow and make its conversion call resolve to the new function.
5. Change the Join Rei booking action to record a booking conversion before opening the booking link in a new tab. Preserve normal booking behavior if tracking is unavailable.
6. Update the database constraint/types for the booking conversion type and add the required grants/RLS-compatible migration changes.
7. Add focused tests/checks for duplicate conversion attempts, missing/invalid referral codes, each conversion type, and attribution persistence between `/r/:code`, `/rei`, and the package/booking flows.

## Verification
- Verify a referral landing click creates one click row with its session.
- Verify a test registration creates one `registration` conversion linked to that click.
- Verify a completed package payment creates one `payment` conversion with the payment amount.
- Verify a booking click creates one `booking` conversion and opens the booking URL.
- Verify repeat callbacks/webhooks do not duplicate points or conversion rows.
- Check the live build and function logs after deployment; report each path separately if a real payment or booking cannot be completed in the test environment.