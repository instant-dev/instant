import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

import InstantPayments from '@instant.dev/payments';
const payments = new InstantPayments(
  process.env.STRIPE_SECRET_KEY,
  process.env.STRIPE_PUBLISHABLE_KEY,
  `./_instant/payments/cache/stripe_plans.json` // create with instant payments:sync
);

/**
 * Retrieves a list of all invoices for the user
 * @param {boolean} upcoming If true, Only retrieve the upcoming invoice
 * @returns {object}         invoicesResult
 * @returns {?array<object>} invoicesResult.invoices
 * @returns {?object}        invoicesResult.nextInvoice
 */
export async function GET (upcoming = false, context) {

  const email = 'test@test.com'; // replace with user authorization and email

  if (upcoming) {

    const nextInvoice = await payments.invoices.upcoming({email});
    return {nextInvoice};

  } else {

    const [invoices, nextInvoice] = await Promise.all([
      payments.invoices.list({email}),
      payments.invoices.upcoming({email})
    ]);

    return {invoices, nextInvoice};

  }

};
