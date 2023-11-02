const colors = require('colors/safe');
const semver = require('semver');

const path = require('path');
const https = require('https');

const drawBox = require('./draw_box.js');

module.exports = async (print = false) => {

  const pkgs = {self: require('../package.json')};
  try {
    pkgs.orm = require(path.join(process.cwd(), '/node_modules/@instant.dev/orm/package.json'));
  } catch (e) {
    // do nothing:
    // @instant.dev/orm not installed
  }
  try {
    pkgs.api = require(path.join(process.cwd(), '/node_modules/@instant.dev/api/package.json'));
  } catch (e) {
    // do nothing:
    // @instant.dev/api not installed
  }
  try {
    pkgs.deploy = require(path.join(process.cwd(), '/node_modules/@instant.dev/deploy/package.json'));
  } catch (e) {
    // do nothing:
    // @instant.dev/deploy not installed
  }
  try {
    pkgs.vectors = require(path.join(process.cwd(), '/node_modules/@instant.dev/vectors/package.json'));
  } catch (e) {
    // do nothing:
    // @instant.dev/vectors not installed
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
    },
    {
      title: 'Instant API',
      name: pkgs.api ? pkgs.api.name : null,
      version: pkgs.api ? pkgs.api.version : null
    },
    {
      title: 'Instant DeploymentManager',
      name: pkgs.deploy ? pkgs.deploy.name : null,
      version: pkgs.deploy ? pkgs.deploy.version : null,
      dev: true
    },
    {
      title: 'Instant Vectors',
      name: pkgs.vectors ? pkgs.vectors.name : null,
      version: pkgs.vectors ? pkgs.vectors.version : null
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
  if (updatePackages.length && print) {
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
        }),
        ``,
        `or install all with:`,
        `${colors.bold.grey(`instant update`)}`
      )
    );
  }

  return verifiedPackages;

};
