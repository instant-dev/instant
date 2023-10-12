import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

const User = Instant.Model('User');

/**
 * Lists all users
 * @returns {object[]} users
 */
export async function GET (context) {

  let user = await User.authenticate(context.http.headers);
  let users = await User.query()
    .orderBy('created_at', 'ASC')
    .select();
  return users;

};

/**
 * Creates a user
 * @param {string} email User email
 * @param {string} password User desired password
 * @param {string} repeat_password Repeated password, must be identical
 * @returns {object} user
 */
export async function POST (email, password, repeat_password, context) {

  let user = await User.signup({email, password, repeat_password});
  return user;

};