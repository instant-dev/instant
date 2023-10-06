import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

/**
 * Authenticates a user to the API
 * @param {string} username The email of the authenticating user
 * @param {string} password The password of the authenticating user
 * @param {"password"} grant_type The OAuth grant_type, must be "password"
 */
export async function POST (username, password, grant_type, context) {

  const User = Instant.Model('User');

  let user = await User.login(
    {username, password, grant_type},
    context.remoteAddress,
    context.http.headers['user-agent']
  );
  return user.joined('accessTokens')[0];

};
