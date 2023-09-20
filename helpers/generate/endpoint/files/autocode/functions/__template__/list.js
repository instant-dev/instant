const Instant = require('@instant.dev/orm')();

/**
 * List all ModelNames
 * Can be queried with e.g. {username__in: ['...']} and other parameters
 */
module.exports = async (context) => {

  await Instant.connect();
  const ModelName = Instant.Model('ModelName');

  let modelNames = await ModelName.query()
      .where(context.params)
      .select();
  return modelNames;

};
