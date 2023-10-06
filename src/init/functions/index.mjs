import InstantORM from '@instant.dev/orm';
const t0 = new Date().valueOf();
const Instant = await InstantORM.connectToPool();
const connectTime = new Date().valueOf() - t0;

export async function GET () {

  return {
    message: [
      `Welcome to instant.dev!`,
    ],
    connectTime
  };

};