import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

/**
 * Retrieves logged in user information
 */
export async function GET (context) {

  await Instant.connect();
  const User = Instant.Model('User');

  let user = await User.authenticate(context.http.headers);
  return user;

};
