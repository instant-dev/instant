const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('i')();

const fileWriter = require('../../file_writer.js');

module.exports = async (Instant, params) => {

  const framework = fileWriter.determineFramework();
  const pathname = path.join(__dirname, 'files', framework);
  if (!fs.existsSync(pathname)) {
    throw new Error(`No endpoint template found for framework "${framework}"`);
  }
  const modelFor = ((params.vflags.for || [])[0] || '');
  if (!modelFor) {
    throw new Error(`No for model specified. Please use --for`);
  }
  const model = Instant.Model(modelFor);
  if (!model) {
    throw new Error(`No model matching "${modelFor}" found.`);
  }
  const names = {};
  names.ModelName = inflect.classify(modelFor);
  names.modelName = names.ModelName[0].toLowerCase() + names.ModelName.slice(1);
  names.modelNames = inflect.pluralize(names.modelName);
  names.model_names = inflect.tableize(names.modelNames);

  const files = fileWriter.readRecursive(pathname);
  for (const filename in files) {
    let newFilename = filename;
    let fileData = files[filename];
    if (filename.match(/\/__template__([\/\.])/gi)) {
      newFilename = filename.replace(/\/__template__([\/\.])/gi, `/${names.model_names}$1`);
      let fileString = files[filename].toString();
      Object.keys(names).forEach(key => fileString = fileString.replaceAll(key, names[key]));
      fileData = Buffer.from(fileString);
    }
    console.log(colors.bold.black(`FrameworkFileWriter:`) +  ` Writing file "${newFilename}" for framework "${framework}" ...`);
    let result = fileWriter.writeFile(newFilename, fileData, false);
    if (!result) {
      console.log(colors.bold.black(`FrameworkFileWriter:`) +  colors.yellow(` Warn: Skipped "${newFilename}" (already exists)`));
    }
  }

  console.log();
  console.log(colors.bold.green(`Successfully created endpoint for "${names.ModelName}"!`));
  console.log();

  return true;

};