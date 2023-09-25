const colors = require('colors/safe');
const semver = require('semver');
const commandExists = require('command-exists').sync;

const fs = require('fs');
const path = require('path');
const https = require('https');

const drawBox = require('./draw_box.js');

module.exports = async (params = null, validate = false) => {

  const isPostgresInstalled = commandExists('psql');

  if (!isPostgresInstalled) {
    console.log();
    console.log(colors.bold.red(`Missing PostgreSQL installation`));
    console.log();
    console.log(`In order to use ${colors.bold('instant.dev')}, you must have PostgreSQL installed locally.`);
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
        `https://api.instant.dev/cli_requests/create`,
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

  const pkgs = {self: require('../package.json')};
  try {
    pkgs.orm = require(path.join(process.cwd(), '/node_modules/@instant.dev/orm/package.json'));
  } catch (e) {
    // do nothing:
    // @instant.dev/orm not installed
  }
  const packages = [
    {
      title: 'Instant CLI',
      name: pkgs.self.name,
      version: pkgs.self.version,
      global: true
    },
    {
      title: 'Instant ORM',
      name: pkgs.orm ? pkgs.orm.name : null,
      version: pkgs.orm ? pkgs.orm.version : null
    }
  ];
  const checkPackages = packages.filter(pkg => !!pkg.name);
  const verifiedPackages = await Promise.all(
    checkPackages.map(pkg => {
      return (async () => {
        try {
          const response = await new Promise((resolve, reject) => {
            const req = https.request(`https://registry.npmjs.org/${pkg.name}/latest`, res => {
              const buffers = [];
              res.on('data', data => buffers.push(data));
              res.on('end', () => resolve(Buffer.concat(buffers)));
            })
            req.on('error', err => reject(err));
            req.end();
          });
          const json = JSON.parse(response.toString());
          pkg.latest = json.version;
          return pkg;
        } catch (e) {
          // we want to be able to use CLI offline
          // or if NPM is down / returning bad data
          // so just set latest equal to version
          pkg.latest = pkg.version;
          return pkg;
        }
      })();
    })
  );
  const updatePackages = verifiedPackages.filter(pkg => semver.gt(pkg.latest, pkg.version));
  if (updatePackages.length) {
    console.log();
    console.log(
      drawBox.center(
        `yellow`,
        ``,
        `Updates are available for ${colors.bold('instant.dev')}:`,
        ``,
        ...updatePackages.map(pkg => {
          return [
            pkg.title,
            `${pkg.version} -> ${colors.bold.green(pkg.latest)}`,
            `${colors.bold.grey(`npm i ${pkg.name}@latest${pkg.global ? ' -g' : ''}`)}`,
            ``
          ].join('\n')
        })
      )
    );
  }

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
