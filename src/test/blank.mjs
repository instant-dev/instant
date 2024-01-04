const chai = await import('chai');
const expect = chai.expect;

/**
 * Name test
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('Runs a test', async () => {

    expect(true).to.equal(true);

  });

};