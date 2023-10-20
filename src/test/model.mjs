import InstantORM from '@instant.dev/orm';

import chai from 'chai';
const expect = chai.expect;

const Instant = await InstantORM.connectToPool();
const ModelName = Instant.Model('ModelName');

export const name = `Model tests: ModelName`;
/**
 * Model tests: ModelName
 * @param {any} setupResult Result of the function passed to `.setup()` in `test/run.mjs`
 */
export default async function (setupResult) {

  it('Can create ModelName', async () => {

    let modelName = await ModelName.create({});

    expect(modelName).to.exist;
    expect(modelName.get('id')).to.exist;
    expect(modelName.get('created_at')).to.exist;

  });

  it('Can query ModelName', async () => {

    let modelName = await ModelName.query().first();

    expect(modelName).to.exist;
    expect(modelName.get('id')).to.exist;
    expect(modelName.get('created_at')).to.exist;

  });

  it('Can destroy ModelName', async () => {

    let modelName = await ModelName.query().first();
    await modelName.destroy();

    let modelNames = await ModelName.query()
      .where({id: modelName.get('id')})
      .select();

    expect(modelName.inStorage()).to.equal(false);
    expect(modelNames.length).to.equal(0);

  });

};