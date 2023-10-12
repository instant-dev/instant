import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

const User = Instant.Model('User');

/**
 * Retrieves logged in user information
 * @returns {object} user
 */
export async function GET (context) {

  let user = await User.authenticate(context.http.headers);
  return user;

};
