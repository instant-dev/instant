const chai = await import('chai');
const expect = chai.expect;

export const name = `Endpoint tests: Pathname`;
/**
 * Endpoint tests: Pathname
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  // Method Begin
  it('Responds to HTTP Method', async () => {

    let result = await this.__method__('Pathname', {});

    expect(result.json).to.exist;

  }); // Method End

};