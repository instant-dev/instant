const InstantORM = require('@instant.dev/orm');
const Instant = new InstantORM();
const Errors = require('../../helpers/errors.js');

module.exports = async (req, res) => {

  await Instant.connect();
  const User = Instant.Model('User');

  if (req.method === 'POST') {
    // POST handles user registration

    let user;
    try {
      user = await User.signup(req.body);
    } catch (e) {
      return Errors.badRequest(req, res, e);
    }
    return res.status(200).json(user);

  } else if (req.method === 'GET') {
    // GET handles user list, only for logged in users

    let user;
    try {
      user = await User.authenticate(req.headers);
    } catch (e) {
      return Errors.unauthorized(req, res, e);
    }

    let users = await User.query()
      .orderBy('created_at', 'ASC')
      .select();
    return res.status(200).json(users);

  } else {

    return Errors.notImplemented(req, res);

  }

};
