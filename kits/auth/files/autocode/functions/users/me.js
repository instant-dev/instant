const Instant = require('@instant.dev/orm')();

/**
 * Retrieves logged in user information
 */
module.exports = async (context) => {

  await Instant.connect();
  const User = Instant.Model('User');

  let user = await User.authenticate(context.http.headers);
  return user;

};
