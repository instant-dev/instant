const fs = require('fs');
const path = require('path');

module.exports = (validate = false) => {

  const pathname = path.join(process.cwd(), 'node_modules', '@instant.dev/orm');

  if (fs.existsSync(pathname)) {
    return require(pathname)();
  } else if (validate) {
    throw new Error(
      `Instant ORM not installed.\n` +
      `Run \`instant init\` or \`npm i @instant.dev/orm --save\` to proceed.`
    );
  } else {
    return null;
  }

};
