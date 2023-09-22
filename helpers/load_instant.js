const fs = require('fs');
const path = require('path');
const https = require('https');
const colors = require('colors/safe');

const stripColors = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const drawBox = (...text) => {
  let lines = text.join('\n').split('\n')
    .map(line => stripColors(line).length % 2 === 0 ? line : line + ' ');
  let maxLength = Math.max.apply(Math, lines.map(line => stripColors(line).length));
  let minPad = 2;
  let length = maxLength + minPad * 2;
  return [].concat(
    `╔` + `═`.repeat(length) + `╗`,
    lines.map(line => {
      let count = (length - stripColors(line).length) / 2;
      return `║` + ` `.repeat(count) + line + ` `.repeat(count) + `║`;
    }),
    `╚` + `═`.repeat(length) + `╝`,
  ).join('\n');
};

module.exports = async (validate = false, checkVersion = false) => {

  const pkgs = {self: require('../package.json')};
  try {
    pkgs.orm = require(path.join(process.cwd(), '/node_modules/@instant.dev/orm/package.json'));
  } catch (e) {
    // do nothing
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
  const checkPackages = packages.filter(name => !!name);
  const verifiedPackages = await Promise.all(
    checkPackages.map(pkg => {
      return (async () => {
        try {
          const response = await new Promise(resolve => {
            https.request(`https://registry.npmjs.org/${pkg.name}/latest`, res => {
              const buffers = [];
              res.on('data', data => buffers.push(data));
              res.on('end', () => resolve(Buffer.concat(buffers)));
            }).end();
          });
          const json = JSON.parse(response.toString());
          pkg.latest = json.version;
          return pkg;
        } catch (e) {
          console.error(e);
          throw new Error(`Error validating ${pkg.title} version`);
        }
      })();
    })
  );
  const updatePackages = verifiedPackages.filter(pkg => pkg.latest !== pkg.version);
  if (updatePackages.length) {
    console.log();
    console.log(
      drawBox(
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
