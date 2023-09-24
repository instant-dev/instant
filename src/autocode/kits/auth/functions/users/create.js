const InstantORM = require('@instant.dev/orm');
const Instant = new InstantORM();
/**
 * Creates a user
 * @param {string} email User email
 * @param {string} password User desired password
 * @param {string} repeat_password Repeated password, must be identical
 */
module.exports = async (email, password, repeat_password, context) => {

  await Instant.connect();
  const User = Instant.Model('User');

  let user = await User.signup({email, password, repeat_password});
  return user;

};
