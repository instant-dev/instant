import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

const ModelName = Instant.Model('ModelName');

/**
 * Retrieves a list of ModelNames matching provided parameters
 * For example, {id: 1} will retrieve only ModelName(id=1),
 * or {title__icontains: "hello"} will retrieve all ModelNames with name containing "hello".
 * Fields hidden via ModelName.hides('field') will not be queried.
 * @returns {object}   response
 * @returns {object}   response.meta
 * @returns {integer}  response.meta.total
 * @returns {integer}  response.meta.count
 * @returns {integer}  response.meta.offset
 * @returns {object[]} response.data
 */
export async function GET (context) {

  const params = {...context.params};
  let modelNames = await ModelName.query()
    .safeWhere(params)
    .select();
  return modelNames.toQueryJSON();

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
