import chai from 'chai';
const expect = chai.expect;

export const name = `Endpoint tests: /payments/plans/`;
/**
 * Endpoint tests: /payments/plans/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('GET: Retrieves all plans', async () => {

    let result = await this.get('/payments/plans/', {});

    expect(result.json).to.exist;
    expect(result.json.plans).to.exist;
    expect(result.json.plans.length).to.equal(2);
    expect(result.json.plans[0].name).to.equal('free_plan');
    expect(result.json.plans[1].name).to.equal('basic_plan');

  });

};