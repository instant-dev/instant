import InstantORM from '@instant.dev/orm';

// 30 days
const DEFAULT_EXPIRATION_LIMIT = 30 * 24 * 60 * 60 * 1000;
// Base58; human-readable
const KEY_CHARACTERS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const MIN_KEY_LENGTH = 32;
const MAX_KEY_LENGTH = 1024;
const DEFAULT_KEY_LENGTH = 64;
const DEFAULT_KEY_PREFIX = 'secret';
const DEFAULT_KEY_ENVIRONMENT = 'development';

class AccessToken extends InstantORM.Core.Model {

  static tableName = 'access_tokens';

  /**
   * If expires_at isn't custom, set the default limit
   * Also set valid true by default
   */
  async beforeSave (txn) {
    if (!this.get('expires_at')) {
      this.set(
        'expires_at',
        new Date(new Date().valueOf() + DEFAULT_EXPIRATION_LIMIT)
      );
    }
    if (this.get('is_valid', null) === null) {
      this.set('is_valid', true);
    }
  }

  /**
   * Generates an access token key
   * @param {string} length Length of key to generate
   */
  static generateKey (length) {
    length = parseInt(length) || DEFAULT_KEY_LENGTH;
    length = Math.max(MIN_KEY_LENGTH, Math.min(length, MAX_KEY_LENGTH));
    const env = process.env.NODE_ENV || DEFAULT_KEY_ENVIRONMENT;
    const key = Array(length).fill(0).map(v => {
      return KEY_CHARACTERS[(Math.random() * KEY_CHARACTERS.length) | 0];
    }).join('');
    return `${DEFAULT_KEY_PREFIX}_${env}_${key}`;
  }

  /**
   * Verifies an access token key and return joined user
   * @param {string} key The access token key to verify
   */
  static async verify (key) {
    let accessTokens = await this.query()
      .join('user')
      .where({
        key,
        is_valid: true,
        expires_at__gte: new Date()
      })
      .select();
    if (!accessTokens.length) {
      throw new Error('Access token key is invalid');
    }
    let accessToken = accessTokens[0];
    if (!accessToken.joined('user')) {
      throw new Error('Access token key belongs to an invalid user');
    }
    return accessToken;
  }

  /**
   * Destroys an active access token via its key, logging user out
   * @param {string} key The access token key to invalidate
   */
  static async invalidate (key) {
    let accessToken = await this.verifySession(key);
    return accessToken.destroy();
  }

}

// hides a field: prevent output via .toJSON()
AccessToken.hides('id');
AccessToken.hides('user_id');

export default AccessToken;
