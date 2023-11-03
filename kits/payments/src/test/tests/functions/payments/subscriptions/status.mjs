import chai from 'chai';
const expect = chai.expect;

export const name = `Endpoint tests: /payments/subscriptions/status/`;
/**
 * Endpoint tests: /payments/subscriptions/status/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('GET: Gets the billing status for a user when not subscribed', async () => {

    let result = await this.get('/payments/subscriptions/status', {});

    expect(result.json).to.exist;
    expect(result.json.currentPlan).to.exist;
    expect(result.json.currentPlan.is_billable).to.equal(false);

  });

};