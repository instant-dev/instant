import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

const ModelName = Instant.Model('ModelName');

/**
 * Retrieve an existing ModelName or a list of models
 * @param {integer{1,}} id The id of the model to retrieve
 * @returns {object} modelNameOrQueryResponse
 */
export async function GET (id = null, context) {

  if (id === null) {

    const params = {...context.params};
    delete params.id;

    let modelNames = await ModelName.query()
      .where(params)
      .select();
    return modelNames.toQueryJSON();

  } else {

    let modelName = await ModelName.find(id);
    return modelName;

  }

};

/**
 * Create a new ModelName
 * @returns {object} modelName
 */
export async function POST (context) {

  const params = {...context.params};
  delete params.id;

  let modelName = await ModelName.create(params);
  return modelName;

}

/**
 * Update an existing ModelName
 * @param {integer{1,}} id The id of the model to update
 * @returns {object} modelName
 */
export async function PUT (id, context) {

  const params = {...context.params};
  delete params.id;

  let modelName = await ModelName.update(id, params);
  return modelName;

};


/**
 * Destroy an existing ModelName
 * @param {integer{1,}} id The id of the model to destroy
 * @returns {object} modelName
 */
export async function DELETE (id, context) {

  let modelName = await ModelName.destroy(id);
  return modelName;

};
