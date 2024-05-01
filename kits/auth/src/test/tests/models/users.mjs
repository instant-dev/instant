import InstantORM from '@instant.dev/orm';

const chai = await import('chai');
const expect = chai.expect;

const Instant = await InstantORM.connectToPool();
const User = Instant.Model('User');

export const name = `User tests`;
/**
 * User tests
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('Can create User', async () => {

    let user = await User.create({email: 'test@test.com', password: 'abc123'});

    expect(user).to.exist;
    expect(user.get('id')).to.exist;
    expect(user.get('created_at')).to.exist;

  });

  it('Can query User', async () => {

    let user = await User.query().first();

    expect(user).to.exist;
    expect(user.get('id')).to.exist;
    expect(user.get('created_at')).to.exist;

  });

  it('Can destroy User', async () => {

    let user = await User.query().first();
    await user.destroy();

    let users = await User.query()
      .where({id: user.get('id')})
      .select();

    expect(user.inStorage()).to.equal(false);
    expect(users.length).to.equal(0);

  });

};