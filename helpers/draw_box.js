const colors = require('colors/safe');

const stripColors = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

module.exports = {
  center: (color, ...text) => {
    colorize = colors[color] || (v => v);
    let lines = text.join('\n').split('\n')
      .map(line => stripColors(line).length % 2 === 0 ? line : line + ' ');
    let maxLength = Math.max.apply(Math, lines.map(line => stripColors(line).length));
    let minPad = 2;
    let length = maxLength + minPad * 2;
    return [].concat(
      colorize(`╔` + `═`.repeat(length) + `╗`),
      lines.map(line => {
        let count = (length - stripColors(line).length) / 2;
        return colorize(`║`) + ` `.repeat(count) + line + ` `.repeat(count) + colorize(`║`);
      }),
      colorize(`╚` + `═`.repeat(length) + `╝`)
    ).join('\n');
  },
  left: (color, ...text) => {
    colorize = colors[color] || (v => v);
    let lines = text.join('\n').split('\n')
      .map(line => stripColors(line).length % 2 === 0 ? line : line + ' ');
    let maxLength = Math.max.apply(Math, lines.map(line => stripColors(line).length));
    let minPad = 2;
    let length = maxLength + minPad * 2;
    return [].concat(
      colorize(`╔` + `═`.repeat(length) + `╗`),
      lines.map(line => {
        let count = length - stripColors(line).length - minPad;
        return colorize(`║`) + ` `.repeat(minPad) + line + ` `.repeat(count) + colorize(`║`);
      }),
      colorize(`╚` + `═`.repeat(length) + `╝`),
    ).join('\n');
  }
};
