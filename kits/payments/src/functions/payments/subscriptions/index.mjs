import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

import InstantPayments from '@instant.dev/payments';
const payments = new InstantPayments(
  process.env.STRIPE_SECRET_KEY,
  process.env.STRIPE_PUBLISHABLE_KEY,
  `./_instant/payments/cache/stripe_plans.json` // create with instant payments:sync
);

/**
 * Retrieves the user's current plan
 * @returns {object}   currentSubscription
 * @returns {object[]} currentSubscription.plans
 * @returns {object}   currentSubscription.currentPlan
 */
export async function GET (context) {

  const email = 'test@test.com'; // replace with user authorization and email
  return payments.plans.current({email});

};

/**
 * Subscribe a user to a specific plan, also handles upgrades and downgrades
 * @param {string} planName The name of the plan to subscribe to
 * @param {object} lineItemCounts Desired line item counts to subscribe to
 * @returns {object} subscriptionResult
 * @returns {string} subscriptionResult.stripe_publishable_key
 * @returns {string} subscriptionResult.stripe_checkout_session_id
 */
export async function POST (planName, lineItemCounts = null, context) {

  const email = 'test@test.com'; // replace with user authorization and email
  const existingLineItemCounts = {}; // replace with user's current usage
  const successURL = 'https://example.com/path/to/succes/page';
  const cancelURL = 'https://example.com/path/to/cancel/page';

  return payments.customers.subscribe({
    email,
    planName,
    lineItemCounts,
    existingLineItemCounts,
    successURL,
    cancelURL
  });

}

/**
 * Unsubscribe a user completely
 * @returns {boolean} unsubscribeResult
 */
export async function DELETE (context) {

  const email = 'test@test.com'; // replace with user authorization and email
  const existingLineItemCounts = {}; // replace with user's current usage

  return payments.customers.unsubscribe({
    email,
    existingLineItemCounts
  });

};
