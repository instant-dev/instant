const Instant = require('@instant.dev/orm')();

/**
 * Authenticates a user to the API
 * @param {string} username The email of the authenticating user
 * @param {string} password The password of the authenticating user
 * @param {string} grant_type The OAuth grant_type, must be "password" {?} ["password"]
 */
module.exports = async (username, password, grant_type, context) => {

  await Instant.connect();
  const User = Instant.Model('User');

  let user = await User.login(
    {username, password, grant_type},
    context.remoteAddress,
    context.http.headers['user-agent']
  );
  return user.joined('accessTokens')[0];

};
