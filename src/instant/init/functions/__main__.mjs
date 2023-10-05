import InstantORM from '@instant.dev/orm';
const Instant = await InstantORM.connectToPool();

/**
 * Sample root endpoint for Instant API
 */
export default async (context) => {
  return {
    message: [
      `Welcome to Instant API and Instant ORM powered by instant.dev!`,
      `This is a test endpoint that provides some connection latency data.`,
    ]
  };
};