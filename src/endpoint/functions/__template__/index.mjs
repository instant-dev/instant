import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

/**
 * Retrieve an existing ModelName or a list of models
 * @param {integer} id The id of the model to update
 */
export async function GET (id = null, context) {

  const ModelName = Instant.Model('ModelName');

  if (id === null) {
    let modelNames = await ModelName.query()
    .where(context.params)
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

  let modelName = new ModelName(context.params);
  await modelName.save();
  return modelName;

}

/**
 * Update an existing ModelName
 * @param {integer} id The id of the model to update
 */
export async function PUT (id, context) {

  const ModelName = Instant.Model('ModelName');

  let modelName = await ModelName.find(id);
  modelName.read(context.params);
  await modelName.save();
  return modelName;

};


/**
 * Destroy an existing ModelName
 * @param {integer} id The id of the model to update
 */
export async function DELETE (id, context) {

  const ModelName = Instant.Model('ModelName');

  let modelName = await ModelName.find(id);
  await modelName.destroy();
  return modelName;

};
