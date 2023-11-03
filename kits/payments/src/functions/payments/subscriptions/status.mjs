import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

import InstantPayments from '@instant.dev/payments';
const payments = new InstantPayments(
  process.env.STRIPE_SECRET_KEY,
  process.env.STRIPE_PUBLISHABLE_KEY,
  `./_instant/payments/cache/stripe_plans.json` // create with instant payments:sync
);

/**
 * Retrieves the user's current plan billing status details
 * @returns {object}   currentSubscription
 * @returns {object}   currentSubscription.currentPlan
 */
export async function GET (context) {

  const email = 'test@test.com'; // replace with user authorization and email
  return payments.plans.billingStatus({email});

};
