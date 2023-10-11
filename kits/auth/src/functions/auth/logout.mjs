import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

const User = Instant.Model('User');

/**
 * Logs a user out
 */
export async function POST (context) {

  let accessToken = await User.logout(context.http.headers);
  return accessToken;

};
