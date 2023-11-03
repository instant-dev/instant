import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

import InstantPayments from '@instant.dev/payments';
const payments = new InstantPayments(
  process.env.STRIPE_SECRET_KEY,
  process.env.STRIPE_PUBLISHABLE_KEY,
  `./_instant/payments/cache/stripe_plans.json` // create with instant payments:sync
);

/**
 * Retrieves a list of all payment methods for the user
 * @returns {object}   paymentMethodsResult
 * @returns {object[]} paymentMethodsResult.paymentMethods
 */
export async function GET (context) {

  const email = 'test@test.com'; // replace with user authorization and email
  const paymentMethods = await payments.paymentMethods.list({email});
  return {paymentMethods};

};

/**
 * Creates a payment method for the user via Stripe Checkout
 */
export async function POST (context) {

  const email = 'test@test.com'; // replace with user authorization and email
  const successURL = 'https://example.com/path/to/succes/page';
  const cancelURL = 'https://example.com/path/to/cancel/page';

  return payments.paymentMethods.create({
    email,
    successURL,
    cancelURL
  });

}

/**
 * Changes a payment method to default
 * @param {string} paymentMethodId
 * @param {boolean} isDefault
 */
export async function PUT (paymentMethodId, isDefault, context) {

  if (!isDefault) {
    throw new Error(`400: Can only set isDefault to true`);
  }

  const email = 'test@test.com'; // replace with user authorization and email

  return payments.paymentMethods.setDefault({email, paymentMethodId});

};


/**
 * Removes a payment method from the user's account
 * @param {string} paymentMethodId
 */
export async function DELETE (paymentMethodId, context) {

  const email = 'test@test.com'; // replace with user authorization and email

  return payments.paymentMethods.remove({email, paymentMethodId});

};
