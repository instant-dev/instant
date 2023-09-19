const fs = require('fs');
const path = require('path');

module.exports = {

  determineFramework () {
    if (fs.existsSync('.vercel')) {
      return 'vercel';
    } else if (fs.existsSync('stdlib.json')) {
      return 'autocode';
    } else {
      return 'default';
    }
  },

  readRecursive (root, pathname = '', files = {}) {
    let filenames = fs.readdirSync(path.join(root, pathname));
    filenames.forEach(filename => {
      let filepath = [pathname, filename].join('/');
      let fullpath = path.join(root, filepath);
      let stat = fs.statSync(fullpath);
      if (stat.isDirectory()) {
        this.readRecursive(root, filepath, files);
      } else {
        files[filepath] = fs.readFileSync(fullpath);
      }
    });
    return files;
  },

  writeFile (filename, buffer, overwrite = true, validate = false) {
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
          return false;
        }
      }
    }
    fs.writeFileSync(path.join('.', filename), buffer);
    return true;
  }

};
