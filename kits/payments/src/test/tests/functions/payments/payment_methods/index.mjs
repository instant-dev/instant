import chai from 'chai';
const expect = chai.expect;

export const name = `Endpoint tests: /payments/payment_methods/`;
/**
 * Endpoint tests: /payments/payment_methods/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('GET: Retrieves all payment methods for a user', async () => {

    let result = await this.get('/payments/payment_methods/', {});

    expect(result.json).to.exist;
    expect(result.json.paymentMethods).to.exist;
    expect(result.json.paymentMethods.length).to.equal(0);

  });

  it('POST: Creates a checkout session for a payment method', async () => {

    let result = await this.post('/payments/payment_methods/', {});

    expect(result.json).to.exist;
    expect(result.json.stripe_publishable_key).to.exist;
    expect(result.json.stripe_checkout_session_id).to.exist;

  });

  // it('PUT: Sets a payment method to default', async () => {});
  // it('DELETE: Removes a payment method', async () => {});

};