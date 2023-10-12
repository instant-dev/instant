import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

const User = Instant.Model('User');

/**
 * Authenticates a user to the API
 * @param {string} username The email of the authenticating user
 * @param {string} password The password of the authenticating user
 * @param {"password"} grant_type The OAuth grant_type, must be "password"
 * @returns {object} accessToken
 */
export async function POST (username, password, grant_type, context) {

  let user = await User.login(
    {username, password, grant_type},
    context.remoteAddress,
    context.http.headers['user-agent']
  );
  return user.joined('accessTokens')[0];

};
