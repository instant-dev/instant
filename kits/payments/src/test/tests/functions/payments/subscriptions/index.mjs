import chai from 'chai';
const expect = chai.expect;

export const name = `Endpoint tests: /payments/subscriptions/`;
/**
 * Endpoint tests: /payments/subscriptions/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('GET: Gets the subscription for a user when not subscribed', async () => {

    let result = await this.get('/payments/subscriptions/', {});

    expect(result.json).to.exist;
    expect(result.json.plans).to.exist;
    expect(result.json.plans.length).to.equal(2);
    expect(result.json.currentPlan).to.exist;
    expect(result.json.currentPlan.name).to.equal('free_plan');
    expect(result.json.currentPlan.is_billable).to.equal(false);

  });

  it('POST: Creates a Checkout session for the user', async () => {

    let result = await this.post('/payments/subscriptions/', {planName: 'basic_plan'});

    expect(result.json).to.exist;
    expect(result.json.stripe_publishable_key).to.exist;
    expect(result.json.stripe_checkout_session_id).to.exist;

  });

  it('DELETE: Unsubscribes the user (always works)', async () => {

    let result = await this.del('/payments/subscriptions/', {});

    expect(result.json).to.exist;
    expect(result.json).to.equal(true);

  });

};