import chai from 'chai';
const expect = chai.expect;

export const name = `Endpoint tests: /users/`;
/**
 * Endpoint tests: /users/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  let authToken;

  it('Creates a user via HTTP POST', async () => {

    let result = await this.post('/users/', {email: 'test@signup.com', password: 'abc123', repeat_password: 'abc123'});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.email).to.equal('test@signup.com');
    expect(result.json.created_at).to.exist;
    expect(result.json.updated_at).to.exist;
    expect(result.json.password).to.not.exist;

  });

  it('Returns 401 Unauthorized for HTTP GET without Bearer token', async () => {

    let result = await this.get('/users/', {});

    expect(result.statusCode).to.equal(401);
    expect(result.json).to.exist;
    expect(result.json.error).to.exist;
    expect(result.json.error.type).to.contain('Unauthorized');

  });

  it('Logs in user via /auth/ HTTP POST', async () => {

    let result = await this.post('/auth/', {username: 'test@signup.com', password: 'abc123', grant_type: 'password'});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.key).to.exist;
    expect(result.json.created_at).to.exist;
    expect(result.json.updated_at).to.exist;

    authToken = result.json.key;

  });

  it('Returns 200 OK for HTTP GET with Bearer token', async () => {

    let result = await this.get('/users/', {}, {Authorization: `Bearer ${authToken}`});

    expect(result.statusCode).to.equal(200);
    expect(result.json).to.exist;
    expect(result.json.meta).to.exist;
    expect(result.json.meta.total).to.be.greaterThan(0);
    expect(result.json.data).to.exist;
    expect(result.json.data.length).to.be.greaterThan(0);
    expect(result.json.data).to.satisfy(data => data.find(user => user.email === 'test@signup.com'));

  });

};