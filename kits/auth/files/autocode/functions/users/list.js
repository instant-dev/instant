const Instant = require('@instant.dev/orm')();

/**
 * Lists all users
 */
module.exports = async (context) => {

  await Instant.connect();
  const User = Instant.Model('User');

  let user = await User.authenticate(context.http.headers);
  let users = await User.query()
    .orderBy('created_at', 'ASC')
    .select();
  return users;

};
