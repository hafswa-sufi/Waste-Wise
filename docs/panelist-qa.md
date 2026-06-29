# WasteWise Panelist Q&A

## What problem does WasteWise solve?

WasteWise helps households act before food becomes waste. It tracks pantry items,
estimates freshness, prompts consumption, and routes surplus food or disposal
requests to verified partners.

## How does the app reduce waste measurably?

The system records each household action as consumed, donated, disposed, or
collected. That creates measurable indicators: quantity consumed before expiry,
surplus submitted for donation, disposal requests handled, and partner
collections completed.

## How does WasteWise know if food is safe to donate?

The app does not claim to certify food safety. It uses expiry data, freshness
estimation, storage location, and local weather conditions as decision support.
Final acceptance still belongs to the receiving NGO, and households remain
responsible for accurate item details.

## Why use weather data in freshness estimation?

Food stored outside refrigeration spoils faster in hotter or more humid
conditions. WasteWise uses the household's saved location to fetch local
temperature and humidity, then adjusts freshness estimates for counter or basket
storage while leaving fridge estimates more stable.

## What happens if the weather API fails?

The app falls back to the normal shelf-life estimate and shows that local climate
data was unavailable. This keeps the app usable even without the API.

## How are NGOs and recycling firms verified?

Organisation users register separately from households and enter organisation
details. Admin reviews the applications and approves or rejects them before they
can access partner dashboards or receive pickup assignments.

## Why does admin assign surplus batches?

Individual household pickups are inefficient. Admin can group nearby households
by estate, building, or pickup area, then assign the whole donation or disposal
batch to one approved partner. This reduces duplicate trips and makes collection
more realistic.

## What prevents the wrong partner from getting a batch?

The app and Firestore rules both restrict assignment by type: donation batches
can go only to approved NGOs, while disposal batches can go only to approved
recycling firms.

## What if two partners want the same pickup?

Unassigned requests can be accepted by a partner or assigned by admin. Once a
request has a `partnerUserId`, other partners no longer see it as available.
Firestore rules also prevent partners from overwriting another partner's
assignment.

## Can partners handle batches as one job?

Yes. Admin-assigned requests receive a shared batch id and batch area. The NGO
and recycling dashboards group assigned requests by batch, show the number of
households and requests, and allow the partner to mark the whole batch as
collected.

## What data is private?

Users can read their own profile data. Admin can read organisation applications
and food activity needed for coordination. Approved partners can read only the
donation or disposal request type relevant to their role, and assigned requests
are tied to their own account.

## What is the biggest limitation?

WasteWise is a coordination prototype, not a certified food inspection system.
Its freshness estimates are advisory, and real deployments would need stronger
food safety policies, partner contracts, and operational procedures.

## What would be improved next?

The next strongest upgrades would be an admin batch map, reassignment and
cancel-flow controls, document upload storage rules, better freshness models by
food category, and analytics exports for waste-reduction reporting.
