const InstantORM = require('@instant.dev/orm');
const Instant = new InstantORM();
const Errors = require('../../helpers/errors.js');

module.exports = async (req, res) => {

  await Instant.connect();
  const User = Instant.Model('User');

  if (req.method === 'GET') {
    // Get logged in user

    let user;
    try {
      user = await User.authenticate(req.headers);
    } catch (e) {
      return Errors.unauthorized(req, res, e);
    }

    return res.status(200).json(user);

  } else {

    return Errors.notImplemented(req, res);

  }

};
