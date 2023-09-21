const Instant = require('@instant.dev/orm')();

/**
 * Create a new ModelName
 */
module.exports = async (context) => {

  await Instant.connect();
  const ModelName = Instant.Model('ModelName');

  let modelName = new ModelName(context.params);
  await modelName.save();
  return modelName;

};