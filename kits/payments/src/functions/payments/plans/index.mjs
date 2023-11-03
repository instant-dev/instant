import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

import InstantPayments from '@instant.dev/payments';
const payments = new InstantPayments(
  process.env.STRIPE_SECRET_KEY,
  process.env.STRIPE_PUBLISHABLE_KEY,
  `./_instant/payments/cache/stripe_plans.json` // create with instant payments:sync
);

/**
 * Retrieves a list of all available plans
 * @returns {object}   plansResult
 * @returns {object[]} plansResult.plans
 */
export async function GET (context) {

  let plans = await payments.plans.list();
  return {plans};

};
