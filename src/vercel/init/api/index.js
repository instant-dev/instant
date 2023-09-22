const Instant = require('@instant.dev/orm')();
const Errors = require('../helpers/errors.js');

module.exports = async (req, res) => {

  if (req.method === 'GET') {

    Instant.enableLogs(2);
    let t = new Date().valueOf();
    await Instant.connect();
    let connectTime = new Date().valueOf() - t;
    return res.status(200).json({
      message: [
        `Welcome to instant.dev on Vercel!`,
        `This is a test endpoint that provides some connection latency data.`,
      ],
      connectTime
    });

  } else {

    return Errors.notImplemented(req, res);

  }

};
