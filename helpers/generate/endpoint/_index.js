const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('i')();

const fileWriter = require('../../file_writer.js');

module.exports = async (Instant, params) => {

  const framework = fileWriter.determineFramework();

  const pathname = path.join(__dirname, '..', '..', '..', 'src', framework, 'endpoint');
  if (!fs.existsSync(pathname)) {
    throw new Error(`No endpoint template found for framework "${colors.bold.green(framework)}"`);
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
  names.ModelNames = inflect.pluralize(names.ModelName);
  names.modelName = names.ModelName[0].toLowerCase() + names.ModelName.slice(1);
  names.modelNames = inflect.pluralize(names.modelName);
  names.model_name = inflect.tableize(names.modelName);
  names.model_names = inflect.tableize(names.modelNames);

  console.log();
  console.log(colors.bold.black(`Generating:`) + ` Endpoints for "${colors.bold.green(names.ModelName)}" for framework "${colors.bold.green(framework)}" ...`);
  console.log();

  const files = fileWriter.readRecursive(pathname);
  for (const filename in files) {
    let newFilename = filename;
    let fileData = files[filename];
    if (filename.match(/\/__template__([\/\.])/gi)) {
      newFilename = filename.replace(/\/__template__([\/\.])/gi, `/${names.model_names}$1`);
      let fileString = files[filename].toString();
      [
        'ModelNames',
        'ModelName',
        'modelNames',
        'modelName',
        'model_names',
        'model_name'
      ].forEach(key => fileString = fileString.replaceAll(key, names[key]));
      fileData = Buffer.from(fileString);
    }
    let result = fileWriter.writeFile(newFilename, fileData, false);
  }

  console.log();
  console.log(colors.bold.green(`Success!`) + ` Created endpoint for "${colors.bold.green(names.ModelName)}" for framework "${colors.bold.green(framework)}"!`);
  console.log();

  return true;

};
