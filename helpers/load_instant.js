const colors = require('colors/safe');
const commandExists = require('command-exists').sync;

const fs = require('fs');
const path = require('path');
const https = require('https');

const verifyPackages = require('./verify_packages.js');

module.exports = async (params = null, validate = false) => {

  const isPostgresInstalled = commandExists('psql');

  if (!isPostgresInstalled) {
    console.log();
    console.log(colors.bold.red(`Missing PostgreSQL installation`));
    console.log();
    console.log(`In order to use ${colors.bold('instant.dev')}, you must have PostgreSQL installed locally.`);
    console.log(`This is verified by the existence of the \`psql\` command, which this CLI relies on.`);
    console.log(`For this reason, a Docker container will not work, you must install Postgres directly.`);
    console.log();
    console.log(`If you are using macOS, the easiest way to get started is ${colors.bold('Postgres.app')}:`);
    console.log(` => ${colors.bold.underline.blue('https://postgresapp.com')}`);
    console.log();
    console.log(`Otherwise, you can install PostgreSQL using one of the recommended installers:`);
    console.log(` => ${colors.bold.underline.blue('https://www.postgresql.org/download')}`);
    throw new Error(`Missing PostgreSQL installation`);
  }

  if (params) {
    const {name, args, flags, vflags} = params;
    await new Promise(resolve => {
      const req = https.request(
        `https://api-latest.instant.dev/v1/cli_requests/`,
        {method: 'POST', headers: {'Content-Type': 'application/json'}},
        res => {
          const buffers = [];
          res.on('data', data => buffers.push(data));
          res.on('end', () => resolve(Buffer.concat(buffers)));
        }
      );
      req.on('error', () => resolve(null));
      req.end(JSON.stringify({_background: true, params: {name, args, flags, vflags}}));
    });
  }

  await verifyPackages(true);

  const pathname = path.join(process.cwd(), 'node_modules', '@instant.dev/orm');

  if (fs.existsSync(pathname)) {
    const InstantORM = require(pathname);
    return new InstantORM();
  } else if (validate) {
    throw new Error(
      `Instant ORM not installed.\n` +
      `Run \`instant init\` or \`npm i @instant.dev/orm --save\` to proceed.`
    );
  } else {
    return null;
  }

};
