const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('inflect');

const fileWriter = require('../../file_writer.js');

module.exports = async (Instant, params) => {

  const framework = fileWriter.determineFramework();
  const pathname = path.join(__dirname, 'files', framework);
  if (!fs.existsSync(pathname)) {
    throw new Error(`No endpoint template found for framework "${framework}"`);
  }
  const files = fileWriter.readRecursive(pathname);

  for (const filename in files) {
    if (filename.match(/\/__template__[\/\.]/gi)) {
      console.log('File found :: ', filename);
    } else {
      console.log(colors.bold.black(`FrameworkFileWriter:`) +  ` Writing file "${filename}" for framework "${framework}" ...`);
      let result = fileWriter.writeFile(filename, files[filename], false);
      if (!result) {
        console.log(colors.bold.black(`FrameworkFileWriter:`) +  ` Skipped "${filename}" (already exists)`);
      }
    }
  }

  return true;

};
