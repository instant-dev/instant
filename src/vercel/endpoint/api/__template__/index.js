const InstantORM = require('@instant.dev/orm');
const Instant = new InstantORM();
const Errors = require('../../helpers/errors.js');

/**
 * Template for GET, POST, PUT, DELETE operations for ModelName
 * Model: ModelName
 * Instance: modelName
 * Array of Instances: modelNames
 */
module.exports = async (req, res) => {

  await Instant.connect();
  const ModelName = Instant.Model('ModelName');

  if (req.method === 'GET') {

    // HTTP GET: List endpoint, filterable
    //  Will allow filtering directly from HTTP request
    //  e.g. ?username__not=a

    let modelNames;
    try {
      modelNames = await ModelName.query()
        .where(req.query)
        .select();
    } catch (e) {
      return Errors.badRequest(req, res, e);
    }
    return res.status(200).json(modelNames);

  } else if (req.method === 'POST') {

    // HTTP POST: Create endpoint
    //  To validate fields, use the model file in _instant/models

    let modelName = new ModelName(req.body);
    try {
      await modelName.save();
    } catch (e) {
      return Errors.badRequest(req, res, e);
    }
    return res.status(200).json(modelName);

  } else if (req.method === 'PUT') {

    // HTTP PUT: Update endpoint
    //  Relies on ?id=x

    let modelName;
    try {
      modelName = await ModelName.find(req.query.id);
      modelName.read(req.body);
      await modelName.save();
    } catch (e) {
      if (e.notFound) {
        return Errors.notFound(req, res);
      } else {
        return Errors.badRequest(req, res, e);
      }
    }
    return res.status(200).json(modelName);

  } else if (req.method === 'DELETE') {

    // HTTP DELETE: Destroy endpoint
    //  Relies on ?id=x

    let modelName;
    try {
      modelName = await ModelName.find(req.query.id);
      await modelName.destroy();
    } catch (e) {
      if (e.notFound) {
        return Errors.notFound(req, res);
      } else {
        return Errors.badRequest(req, res, e);
      }
    }
    return res.status(200).json(modelName);

  } else {

    return Errors.notImplemented(req, res);

  }

};
