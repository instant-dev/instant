import chai from 'chai';
const expect = chai.expect;

// Will default to the filename if no name exported
export const name = `Main Tests`;

/**
 * Main Tests
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  before(async () => {

    // Set up anything you want executed before your test in this file

  });

  it('Loads a startup page', async () => {

    const testUsername = `test user`;

    // TestEngine can make HTTP requests easily via:
    //   this.get(path, queryParams, headers);
    //   this.post(path, bodyParams, headers);
    //   this.put(path, bodyParams, headers);
    //   this.del(path, queryParams, headers);

    let result = await this.get(`/`, {username: testUsername});

    expect(result).to.exist;
    expect(result.statusCode).to.equal(200);
    expect(result.headers).to.exist;
    expect(result.headers['x-instant-api']).to.equal('true');
    expect(result.headers['content-type']).to.equal('application/json');
    expect(result.body).to.exist;
    expect(result.json).to.exist; // will exist on application/json responses
    expect(result.json.message).to.exist;
    expect(result.json.message).to.equal(`Welcome to instant.dev, ${testUsername}!`);

  });

  after(async () => {

    // Tear down and clean up from tests

  });

};