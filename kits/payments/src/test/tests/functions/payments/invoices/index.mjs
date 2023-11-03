import chai from 'chai';
const expect = chai.expect;

export const name = `Endpoint tests: /payments/invoices/`;
/**
 * Endpoint tests: /payments/invoices/
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('GET: Gets all invoices for a user', async () => {

    let result = await this.get('/payments/invoices/', {});

    expect(result.json).to.exist;
    expect(result.json.invoices).to.exist;
    expect(result.json.invoices.length).to.equal(0);
    expect(result.json.nextInvoice).to.equal(null);

  });

  it('GET: Gets upcoming invoices for a user', async () => {

    let result = await this.get('/payments/invoices/', {upcoming: true});

    expect(result.json).to.exist;
    expect(result.json.invoices).to.not.exist;
    expect(result.json.nextInvoice).to.equal(null);

  });

};