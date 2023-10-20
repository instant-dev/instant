const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');
const inflect = require('i')();

const fileWriter = require('../../file_writer.js');

module.exports = async (Instant, params) => {

  let testName = params.args[0] || '';
  testName = testName.split('/').filter(v => !!v).join('/');
  testName = testName.replace(/\.m?js$/gi, '');

  const modelFor = ((params.vflags.for || [])[0] || '');
  const endpointFor = ((params.vflags.function || [])[0] || '');

  if (testName) {

    // do nothing

  } else if (modelFor) {
    
    const pathname = path.join(__dirname, '..', '..', '..', 'src', 'test', 'model.mjs');
    if (!fs.existsSync(pathname)) {
      throw new Error(`No test template found for model.`);
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
    console.log(colors.bold.black(`Generating:`) + ` Tests for "${colors.bold.green(names.ModelName)}" ...`);
    console.log();

    const file = fs.readFileSync(pathname);
    let newFilename = `test/tests/models/${names.model_name}.mjs`;
    let fileString = file.toString();
    [
      'ModelNames',
      'ModelName',
      'modelNames',
      'modelName',
      'model_names',
      'model_name'
    ].forEach(key => fileString = fileString.replaceAll(key, names[key]));
    const fileData = Buffer.from(fileString);
    fileWriter.writeFile(newFilename, fileData, false);

    console.log();
    console.log(colors.bold.green(`Success!`) + ` Created tests for "${colors.bold.green(names.ModelName)}"!`);
    console.log();
  
  } else if (endpointFor) {

    // do nothing

  }

  return true;

};
