import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

/**
 * Retrieve an existing ModelName or a list of models
 * @param {integer{1-}} id The id of the model to retrieve
 */
export async function GET (id = null, context) {

  const ModelName = Instant.Model('ModelName');

  if (id === null) {

    const params = {...context.params};
    delete params.id;

    let modelNames = await ModelName.query()
      .where(params)
      .select();
    return modelNames;

  } else {

    let modelName = await ModelName.find(id);
    return modelName;

  }

};

/**
 * Create a new ModelName
 */
export async function POST (context) {

  const ModelName = Instant.Model('ModelName');

  const params = {...context.params};
  delete params.id;

  let modelName = await ModelName.create(params);
  return modelName;

}

/**
 * Update an existing ModelName
 * @param {integer{1-}} id The id of the model to update
 */
export async function PUT (id, context) {

  const ModelName = Instant.Model('ModelName');

  const params = {...context.params};
  delete params.id;

  let modelName = await ModelName.find(id);
  modelName.read(params);
  await modelName.save();
  return modelName;

};


/**
 * Destroy an existing ModelName
 * @param {integer{1-}} id The id of the model to destroy
 */
export async function DELETE (id, context) {

  const ModelName = Instant.Model('ModelName');

  let modelName = await ModelName.find(id);
  await modelName.destroy();
  return modelName;

};
