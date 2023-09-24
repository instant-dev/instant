const InstantORM = require('@instant.dev/orm');
const Instant = new InstantORM();

/**
 * Destroy an existing ModelName
 * @param {integer} id The id of the model to update
 */
module.exports = async (id, context) => {

  await Instant.connect();
  const ModelName = Instant.Model('ModelName');

  let modelName = await ModelName.find(id);
  await modelName.destroy();
  return modelName;

};
