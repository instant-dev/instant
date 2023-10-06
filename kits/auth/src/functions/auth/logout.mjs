import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

/**
 * Logs a user out
 */
export async function POST (context) {

  await Instant.connect();
  const User = Instant.Model('User');

  let accessToken = await User.logout(context.http.headers);
  return accessToken;

};
