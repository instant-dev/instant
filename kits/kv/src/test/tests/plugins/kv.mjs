import chai from 'chai';
const expect = chai.expect;

export const name = `KV Plugin Test`;
/**
 * KV Plugin Test
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('Loads the KV plugin as expected', async () => {

    const Instant = setupResult.Instant;
    expect(Instant.kv).to.exist;
    expect(Instant.kv.store('main')).to.exist;

  });

};