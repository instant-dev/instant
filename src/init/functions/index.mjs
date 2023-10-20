import InstantORM from '@instant.dev/orm';
const t0 = new Date().valueOf();
const Instant = await InstantORM.connectToPool();
const connectTime = new Date().valueOf() - t0;

/**
 * Sample welcome API
 * We can provide types to our APIs to enforce type-safety
 *   at the HTTP request (@param) and response (@returns) layer
 * @param {string} username 
 * @returns {object}  welcomeMessage
 * @returns {string}  welcomeMessage.message
 * @returns {integer} welcomeMessage.connectTime
 */
export async function GET (username = 'new user') {

  return {
    message: `Welcome to instant.dev, ${username}!`,
    connectTime
  };

};