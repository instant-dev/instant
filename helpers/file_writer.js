const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

module.exports = {

  determineDeployTarget () {
    if (fs.existsSync('.vercel')) {
      return 'vercel';
    } else {
      return 'default';
    }
  },

  readRecursive (root, files = {}, prefix = '', pathname = '') {
    files = files || {};
    let filenames = fs.readdirSync(path.join(root, pathname));
    filenames.forEach(filename => {
      let filepath = [pathname, filename].join('/');
      let fullpath = path.join(root, filepath);
      let stat = fs.statSync(fullpath);
      if (stat.isDirectory()) {
        this.readRecursive(root, files, prefix, filepath);
      } else {
        files[`${prefix}${filepath}`] = fs.readFileSync(fullpath);
      }
    });
    return files;
  },

  writeFile (filename, buffer, overwrite = true, validate = false) {
    if (filename.startsWith('/')) {
      filename = `.${filename}`;
    }
    if (!filename.startsWith('.')) {
      filename = `./${filename}`;
    }
    console.log(colors.bold.black(`FileWriter:`) +  ` Writing file "${filename}" ...`);
    let paths = filename.split('/').slice(1, -1);
    for (let i = 1; i <= paths.length; i++) {
      let pathname = paths.slice(0, i).join('/');
      if (!fs.existsSync(pathname)) {
        fs.mkdirSync(pathname);
      }
    }
    if (!overwrite) {
      if (fs.existsSync(path.join('.', filename))) {
        if (validate) {
          throw new Error(`Could not write, file already exists: "${filename}"`);
        } else {
          console.log(colors.bold.black(`FileWriter:`) + colors.yellow(` Warn: Skipped "${filename}" (already exists)`));
          return false;
        }
      }
    }
    fs.writeFileSync(path.join('.', filename), buffer);
    return true;
  },

  writeLine (filename = '', line) {
    console.log(colors.bold.black(`FileWriter:`) + ` Writing line "${line}" to "${filename}"`);
    const exists = fs.existsSync(filename);
    let fileString = '';
    if (exists) {
      fileString = fs.readFileSync(filename).toString();
    }
    let lines = fileString.split('\n')
      .map(l => l.trim())
      .filter(l => !!l);
    if (!lines.find(l => l === line)) {
      lines.push(line);
    }
    fs.writeFileSync(filename, lines.join('\n'));
  },

  writeJSON (filename, key, value, keepValueIfExists = false) {
    console.log(colors.bold.black(`FileWriter:`) + ` Writing [${key}=${JSON.stringify(value)}] to JSON file "${filename}"`);
    const exists = fs.existsSync(filename);
    let json = {};
    if (exists) {
      let fileString = fs.readFileSync(filename).toString();
      try {
        json = JSON.parse(fileString);
      } catch (e) {
        throw new Error(`Could not write, invalid JSON: "${filename}"`);
      }
      if (!json || typeof json !== 'object' || Array.isArray(json)) {
        throw new Error(`Could not write, JSON not an object: "${filename}"`);
      }
    }
    let keys = key.split('.');
    let writeKey = keys.pop();
    let obj = json;
    while (keys.length) {
      let curKey = keys.shift();
      obj[curKey] = obj[curKey] || {};
      obj = obj[curKey];
    }
    if (!(writeKey in obj) || !keepValueIfExists) {
      obj[writeKey] = value;
    }
    fs.writeFileSync(filename, JSON.stringify(json, null, 2));
    return true;
  }

};
