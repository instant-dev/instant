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
    ``,
    `╔` + `═`.repeat(length) + `╗`,
    lines.map(line => {
      let count = (length - stripColors(line).length) / 2;
      return `║` + ` `.repeat(count) + line + ` `.repeat(count) + `║`;
    }),
    `╚` + `═`.repeat(length) + `╝`,
    ``
  ).join('\n');
};

module.exports = async (validate = false, checkVersion = false) => {

  const pkg = require('../package.json');
  const {name, version} = pkg;
  try {
    const response = await new Promise(resolve => {
      https.request(`https://registry.npmjs.org/${name}/latest`, res => {
        const buffers = [];
        res.on('data', data => buffers.push(data));
        res.on('end', () => resolve(Buffer.concat(buffers)));
      }).end();
    });
    const json = JSON.parse(response.toString());
    if (json.version !== version) {
      console.log(
        drawBox(
          `A new version of the instant.dev CLI is available:`,
          ``,
          `${version} -> ${colors.bold.green(json.version)}`,
          ``,
          `upgrade: ${colors.bold.green(`npm i instant.dev@latest -g`)}`
        )
      )
    }
  } catch (e) {
    console.error(e);
    throw new Error(`Error validating CLI version`);
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
