const Instant = require('@instant.dev/orm')();
const Errors = require('../helpers/errors.js');

module.exports = async (req, res) => {

  await Instant.connect();
  const User = Instant.Model('User');

  if (req.method === 'POST') {
    // Logs a user in

    let user;
    try {
      user = await User.login(
        req.body,
        req.headers['x-real-ip'],
        req.headers['user-agent']
      );
    } catch (e) {
      console.error(e);
      return Errors.badRequest(req, res, e);
    }
    return res.status(200).json(user.joined('accessTokens')[0]);

  } else if (req.method === 'DELETE') {
    // Logs a user out

    let accessToken
    try {
      accessToken = await User.logout(req.headers);
    } catch (e) {
      return Errors.unauthorized(req, res, e);
    }
    return res.status(200).json(accessToken);

  } else {

    return Errors.notImplemented(req, res);

  }

};
