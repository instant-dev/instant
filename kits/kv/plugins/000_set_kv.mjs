import InstantKV from '@instant.dev/kv';
const kv = new InstantKV();

export const plugin = async (Instant) => {
  Instant.kv = new InstantKV();
  await Instant.kv.connect();
};

export const teardown = async (Instant) => {
  await Instant.kv.disconnect();
};