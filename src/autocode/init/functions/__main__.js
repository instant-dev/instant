const Instant = require('@instant.dev/orm')();

/**
 * Sample root endpoint for Autocode
 */
module.exports = async (context) => {
  Instant.enableLogs(2);
  let t = new Date().valueOf();
  await Instant.connect();
  let connectTime = new Date().valueOf() - t;
  return {
    message: [
      `Welcome to instant.dev using Autocode!`,
      `This is a test endpoint that provides some connection latency data.`,
    ],
    connectTime
  };
};
