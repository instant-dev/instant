const chai = await import('chai');
const expect = chai.expect;

export const name = `Endpoint tests: /auth/logout/`;
/**
 * Endpoint tests: /auth/logout/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  let authToken;

  before(async () => {

    await this.post('/users/', {email: 'test+authlogout@signup.com', password: 'abc123', repeat_password: 'abc123'});

  });

  it('Returns 401 Unauthorized for HTTP POST without Bearer token', async () => {

    let result = await this.post('/auth/logout', {});

    expect(result.statusCode).to.equal(401);
    expect(result.json).to.exist;
    expect(result.json.error).to.exist;
    expect(result.json.error.type).to.contain('Unauthorized');

  });

  it('Logs in user via /auth/ HTTP POST', async () => {

    let result = await this.post('/auth/', {username: 'test+authlogout@signup.com', password: 'abc123', grant_type: 'password'});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.key).to.exist;
    expect(result.json.created_at).to.exist;
    expect(result.json.updated_at).to.exist;

    authToken = result.json.key;

  });

  it('Returns 200 OK for HTTP POST with Bearer token', async () => {

    let result = await this.post('/auth/logout/', {}, {Authorization: `Bearer ${authToken}`});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.key).to.exist;
    expect(result.json.created_at).to.exist;
    expect(result.json.updated_at).to.exist;

  });

  it('Returns 401 Unauthorized for HTTP POST with invalidated Bearer token', async () => {

    let result = await this.post('/auth/logout/', {}, {Authorization: `Bearer ${authToken}`});

    expect(result.statusCode).to.equal(401);
    expect(result.json).to.exist;
    expect(result.json.error).to.exist;
    expect(result.json.error.type).to.contain('Unauthorized');

  });

};