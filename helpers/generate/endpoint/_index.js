const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');
const inflect = require('i')();

const fileWriter = require('../../file_writer.js');

module.exports = async (Instant, params) => {

  let writePathname = params.args[0] || '';
  writePathname = writePathname.split('/').filter(v => !!v).join('/');

  const modelFor = ((params.vflags.for || [])[0] || '');
  const isBlank = !!params.vflags.blank;

  if (!modelFor && !isBlank) {
    throw new Error(
      `No "for" model specified.\n` +
      `Please use \`--for [modelName]\` to specify a model,\n` + 
      `or use \`--blank\` to create an empty endpoint`
    );
  } else if (modelFor && isBlank) {
    throw new Error(
      `Can not specify both \`--blank\` and \`--for\``
    );
  } else if (modelFor) {
    const pathname = path.join(__dirname, '..', '..', '..', 'src', 'endpoint');
    if (!fs.existsSync(pathname)) {
      throw new Error(`No endpoint template found.`);
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
    console.log(colors.bold.black(`Generating:`) + ` Endpoints for "${colors.bold.green(names.ModelName)}" ...`);
    console.log();

    const files = fileWriter.readRecursive(pathname);
    for (const filename in files) {
      let newFilename = filename;
      newFilename = newFilename.replace(/^\/functions\//gi, $0 => $0 + (writePathname ? `${writePathname}/` : ``));
      let fileData = files[filename];
      if (newFilename.match(/\/__template__([\/\.])/gi)) {
        newFilename = newFilename.replace(/\/__template__([\/\.])/gi, `/${names.model_names}$1`);
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
    console.log(colors.bold.green(`Success!`) + ` Created endpoint for "${colors.bold.green(names.ModelName)}"!`);
    console.log();
  
  } else if (isBlank) {

    const pathname = path.join(__dirname, '..', '..', '..', 'src', 'endpoint_blank');
    if (!fs.existsSync(pathname)) {
      throw new Error(`No blank endpoint template found.`);
    }

    console.log();
    console.log(colors.bold.black(`Generating:`) + ` Blank endpoints ...`);
    console.log();

    const files = fileWriter.readRecursive(pathname);
    for (const filename in files) {
      let newFilename = filename;
      newFilename = newFilename.replace(/^\/functions\//gi, $0 => $0 + (writePathname ? `${writePathname}/` : ``));
      let fileData = files[filename];
      let result = fileWriter.writeFile(newFilename, fileData, false);
    }

    console.log();
    console.log(colors.bold.green(`Success!`) + ` Created blank endpoint!`);
    console.log();

  }

  return true;

};
