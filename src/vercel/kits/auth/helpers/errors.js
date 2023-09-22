module.exports = {
  handler: (req, res, e) => {
    e && console.error(e);
    return res.status(500).json({
      error: {
        message: e && e.message
          ? `Internal Server Error: ${e.message}`
          : `Internal Server Error`,
        details: e ? e.details : void 0
      }
    });
  },
  badRequest: (req, res, e) => {
    return res.status(400).json({
      error: {
        message: e && e.message
          ? `Bad Request: ${e.message}`
          : `Bad Request`,
        details: e ? e.details : void 0
      }
    });
  },
  unauthorized: (req, res, e) => {
    return res.status(401).json({
      error: {
        message: e && e.message
          ? `Unauthorized: ${e.message}`
          : `Unauthorized`,
        details: e ? e.details : void 0
      }
    });
  },
  notFound: (req, res) => {
    return res.status(404).json({
      error: {
        message: 'Not Found'
      }
    });
  },
  notImplemented: (req, res) => {
    return res.status(501).json({
      error: {
        message: 'Not Implemented'
      }
    });
  }
};
