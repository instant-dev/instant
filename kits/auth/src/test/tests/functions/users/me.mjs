const chai = await import('chai');
const expect = chai.expect;

export const name = `Endpoint tests: /users/me/`;
/**
 * Endpoint tests: /users/me/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  let authToken;

  before(async () => {

    await this.post('/users/', {email: 'test+me@signup.com', password: 'abc123', repeat_password: 'abc123'});

  });

  it('Logs in user via /auth/ HTTP POST', async () => {

    let result = await this.post('/auth/', {username: 'test+me@signup.com', password: 'abc123', grant_type: 'password'});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.key).to.exist;
    expect(result.json.created_at).to.exist;
    expect(result.json.updated_at).to.exist;

    authToken = result.json.key;

  });

  it('Returns 200 OK for HTTP GET with Bearer token', async () => {

    let result = await this.get('/users/me/', {}, {Authorization: `Bearer ${authToken}`});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.email).to.equal('test+me@signup.com');
    expect(result.json.created_at).to.exist;
    expect(result.json.updated_at).to.exist;
    expect(result.json.password).to.not.exist;

  });

};