/**
 * The standing terms of the contractor agreement, and the one line that
 * changes per job.
 *
 * Kept apart from the component that renders them so the server can put the
 * same words in an email — importing a client component into an API route
 * drags React and the animation library along with it.
 */

export const CONTRACT_TERMS = [
  "The contractor agrees to complete the leaflet distribution job within the allocated time stated above.",
  "Contractor must provide a clear schedule of their time to be spent on the job and must inform when starting an activity, pausing or finishing.",
  "Failure to start on time (40 minute window) or start on scheduled days may result in a penalty such as a reduction in pay (5%) per day missed.",
  "Contractor must work the minimum hours stated above, and cover the job area/distance.",
  "Payment will be made within 1 week after Infinite Distribution verifies the tracking data.",
  "The contractor must use the tracking apps specified by Infinite Distribution: MAP MY WALK & STRAVA.",
  "Failure to use both correct apps, failure to track the walk, or suspicious activity such as letting the activity run while stationary or in a vehicle, results in no payment.",
  "If complaints of leaflets being placed in junk mail, or multiple leaflets in a single mailbox, are received: each complaint carries a 2% reduction penalty on pay unless otherwise exempted with permission. Over 5 complaints voids the contract.",
  "If it rains on the assigned day, the contractor may postpone to the next suitable day but must notify Infinite Distribution.",
  "Contractor must take 10 photos of random letterboxes per 1000 leaflets.",
  "Leaflets must remain undamaged. Lost or damaged leaflets may incur a charge.",
  "The contractor is responsible for their own travel, phone battery, and safety.",
  "Contractor must keep client information confidential and must not attempt to contact the client, or it may result in legal action.",
  "If the contractor cancels without a valid reason or without notice, they may lose eligibility for future work.",
  "The contractor is an independent subcontractor, not an employee.",
];

/**
 * Junk mail is decided per job, not once for everyone, so it can't sit in the
 * standing terms — it goes in as its own line on the agreement being signed.
 */
export const junkMailTerm = (allowed: boolean) =>
  allowed
    ? "For this job, leaflets MAY be placed in letterboxes marked ‘No Junk Mail’."
    : "For this job, letterboxes marked ‘No Junk Mail’ must be skipped — do not place leaflets in them.";
