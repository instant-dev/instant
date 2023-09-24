const InstantORM = require('@instant.dev/orm');
const Instant = new InstantORM();

/**
 * Update an existing ModelName
 * @param {integer} id The id of the model to update
 */
module.exports = async (id, context) => {

  await Instant.connect();
  const ModelName = Instant.Model('ModelName');

  let modelName = await ModelName.find(id);
  modelName.read(context.params);
  await modelName.save();
  return modelName;

};
