import InstantORM from '@instant.dev/orm';

import chai from 'chai';
const expect = chai.expect;

const Instant = await InstantORM.connectToPool();
const AccessToken = Instant.Model('AccessToken');

export const name = `AccessToken tests`;
/**
 * AccessToken tests
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('Can create AccessToken', async () => {

    let accessToken = await AccessToken.create({key: 'test_key'});

    expect(accessToken).to.exist;
    expect(accessToken.get('id')).to.exist;
    expect(accessToken.get('created_at')).to.exist;

  });

  it('Can query AccessToken', async () => {

    let accessToken = await AccessToken.query().first();

    expect(accessToken).to.exist;
    expect(accessToken.get('id')).to.exist;
    expect(accessToken.get('created_at')).to.exist;

  });

  it('Can destroy AccessToken', async () => {

    let accessToken = await AccessToken.query().first();
    await accessToken.destroy();

    let accessTokens = await AccessToken.query()
      .where({id: accessToken.get('id')})
      .select();

    expect(accessToken.inStorage()).to.equal(false);
    expect(accessTokens.length).to.equal(0);

  });

};