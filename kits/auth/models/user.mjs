import InstantORM from '@instant.dev/orm';
import bcrypt from 'bcryptjs';

// If there is an access token collision,
// how many times should we retry login?
const MAX_COLLISION_RETRIES = 1;

class User extends InstantORM.Core.Model {

  static tableName = 'users';

  /**
   * Before the user is saved, we need to hash the password if it's been set
   * e.g. via User.signup();
   */
  async beforeSave (txn) {
    if (!this.hasErrors()) {
      // Hash password
      if (this.hasChanged('password')) {
        let hash;
        try {
          hash = bcrypt.hashSync(this.get('password'), 10);
        } catch (err) {
          throw new Error('Could not encrypt password');
        }
        this.__safeSet__('password', hash);
      }
      // All emails lowercase
      if (this.hasChanged('email')) {
        this.set('email', this.get('email').toLowerCase());
      }
    }
  }

  /**
   * Verifies a user's password from an unencrypted input
   * @param {string} unencrypted The plaintext password
   */
  async verifyPassword (unencrypted) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(unencrypted, this.get('password'), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Sign up a new user
   * @param {object} body expects {email, password, repeat_password}
   */
  static async signup (body) {
    const User = this.getModel('User');
    if (!body || typeof body !== 'object') {
      throw new Error(`400: Invalid signup body`);
    }
    ['email', 'password', 'repeat_password'].forEach(key => {
      if (typeof body[key] !== 'string') {
        throw new Error(`400: Invalid "${key}"`);
      }
    });
    if (body.password !== body.repeat_password) {
      throw new Error(`400: Passwords do not match`);
    }
    let user = new User({email: body.email, password: body.password});
    try {
      user = await user.save();
    } catch (e) {
      if (
        e.details._query &&
        e.details._query[0] &&
        e.details._query[0].includes('unique constraint \"users_email_unique\"')
      ) {
        throw new Error(`400: User with email "${body.email}" already exists`);
      } else {
        throw e;
      }
    }
    return user;
  }

  /**
   * Logs in via Oauth2 password grant flow
   * @param {object} body Expects {grant_type: 'password', username, password}
   * @param {string} ipAddress the ip address of the login
   * @param {string} userAgent the user agent of the login
   */
  static async login (body, ipAddress = null, userAgent = null) {
    const AccessToken = this.getModel('AccessToken');
    if (body.grant_type !== 'password') {
      throw new Error('400: Must supply grant_type = "password"');
    }
    let users = await this.query().where({email: body.username}).select();
    if (!users.length) {
      throw new Error('401: Invalid credentials');
    }
    let user = users[0];
    let result = await user.verifyPassword(body.password);
    if (!result) {
      throw new Error('401: Invalid credentials');
    }
    let attempts = MAX_COLLISION_RETRIES + 1;
    while (attempts > 0) {
      let accessToken = new AccessToken({
        user_id: user.get('id'),
        key: AccessToken.generateKey(),
        ip_address: ipAddress,
        user_agent: userAgent
      });
      try {
        await accessToken.save();
      } catch (e) {
        if (
          e.details._query &&
          e.details._query[0] &&
          e.details._query[0].includes('unique constraint "access_tokens_key_unique"')
        ) {
          attempts--;
          continue;
        } else {
          throw e;
        }
      }
      user.setJoined('accessTokens', [accessToken]);
      return user;
    }
    throw new Error(`401: Error authenticating, please try again`);
  }

  /**
   * Retrieves a key from the "Authorization" header
   * @param {object} headers Requires "authorization" header
   */
  static async parseAuthenticationKey (headers) {
    if (!headers['authorization']) {
      throw new Error(`401: Could not authenticate, missing "Authorization" header`);
    } else if (!headers['authorization'].startsWith('Bearer ')) {
      throw new Error(`401: Could not authenticate, "Authorization" must start with "Bearer "`);
    }
    let key = headers['authorization'].slice('Bearer '.length);
    if (!key) {
      throw new Error(`401: Could not authenticate, no key provided`);
    }
    return key;
  }

  /**
   * Authenticates a user to log in via HTTP "Authorization" header
   * @param {object} headers
   */
  static async authenticate (headers) {
    const AccessToken = this.getModel('AccessToken');
    let key = await this.parseAuthenticationKey(headers);
    let accessToken = await AccessToken.verify(key);
    return accessToken.joined('user');
  }

  /**
   * Logs out based on HTTP "Authorization" header
   * @param {object} headers
   */
  static async logout (headers) {
    const AccessToken = this.getModel('AccessToken');
    let key = await this.parseAuthenticationKey(headers);
    return AccessToken.invalidate(key);
  }

}

// Validates email and password before .save()
User.validates('email', 'must be valid', v => v && (v + '').match(/.+@.+\.\w+/i));
User.validates('password', 'must be at least 5 characters in length', v => v && v.length >= 5);

// hides a field: prevent output via .toJSON()
User.hides('password');

export default User;
