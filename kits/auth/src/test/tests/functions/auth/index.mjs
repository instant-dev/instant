const chai = await import('chai');
const expect = chai.expect;

export const name = `Endpoint tests: /auth/`;
/**
 * Endpoint tests: /auth/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  before(async () => {

    await this.post('/users/', {email: 'test+auth@signup.com', password: 'abc123', repeat_password: 'abc123'});

  });

  it('Responds to HTTP POST', async () => {

    let result = await this.post('/auth/', {username: 'test+auth@signup.com', password: 'abc123', grant_type: 'password'});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.key).to.exist;
    expect(result.json.created_at).to.exist;
    expect(result.json.updated_at).to.exist;

  });

};