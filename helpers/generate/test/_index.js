const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');
const inflect = require('i')();

const fileWriter = require('../../file_writer.js');

module.exports = async (Instant, params) => {

  // Run each filesystem migration to emulate schema state
  Instant.Schema.setSchema(Instant.Schema.constructor.emptySchema());
  const tmpMigrations = Instant.Migrator.Dangerous.filesystem.getMigrations();
  for (const migration of tmpMigrations) {
    Instant.Schema.setMigrationId(migration.id);
    for (const command of migration.up) {
      await Instant.Schema[command[0]].apply(Instant.Schema, command.slice(1));
    }
  }
  // Apply changes
  await Instant.Schema.update();
  // Get existing schema file
  let existingSchema = Instant.Migrator.Dangerous.filesystem.getWrittenSchema();
  // Write temporary schema to disk so it can load in endpoint files
  const logLevel = Instant._logLevel;
  Instant.enableLogs(0);
  Instant.Migrator.Dangerous.filesystem.writeSchema(Instant.Schema.toJSON());
  Instant.enableLogs(logLevel);

  try {

    let testName = params.args[0] || '';
    testName = testName.split('/').filter(v => !!v).join('/');
    testName = testName.replace(/\.m?js$/gi, '');

    let modelFor = ((params.vflags.for || [])[0] || '');
    let endpointFor = ((params.vflags.function || [])[0] || '');

    if (testName) {

      const pathname = path.join(__dirname, '..', '..', '..', 'src', 'test', 'blank.mjs');
      if (!fs.existsSync(pathname)) {
        throw new Error(`No test template found for model.`);
      }

      let fileString = fs.readFileSync(pathname).toString();
      fileString = fileString.replaceAll('Name', testName);

      let newFilename = `test/tests/${testName}.mjs`;
      const fileData = Buffer.from(fileString);
      fileWriter.writeFile(newFilename, fileData, false);

      console.log();
      console.log(colors.bold.green(`Success!`) + ` Created tests for "${colors.bold.green(testName)}"!`);
      console.log();

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

      const pathname = path.join(__dirname, '..', '..', '..', 'src', 'test', 'endpoint.mjs');
      if (!fs.existsSync(pathname)) {
        throw new Error(`No test template found for endpoint.`);
      }
      if (!endpointFor.startsWith('/')) {
        endpointFor = `/${endpointFor}`;
      }
      if (endpointFor.startsWith('/functions/')) {
        endpointFor = endpointFor.slice('/functions'.length);
      }
      endpointFor = endpointFor.replace(/\.m?js$/, '');
      let functionPathname = path.join(process.cwd(), `functions`, `${endpointFor}.mjs`);
      if (!fs.existsSync(functionPathname)) {
        functionPathname = path.join(process.cwd(), `functions`, `${endpointFor}.js`);
        if (!fs.existsSync(functionPathname)) {
          throw new Error(`Could not find matching endpoint "${endpointFor}" in "./functions" directory`);
        }
      }

      let methods = [];
      let endpointPath;
      if (endpointFor.endsWith('/index')) {
        endpointPath = endpointFor.slice(0, -('/index').length) + '/';
      } else if (endpointFor.endsWith('/__main__')) {
        endpointPath = endpointFor.slice(0, -('/__main__').length) + '/';
      } else if (endpointFor.endsWith('/__notfound__')) {
        endpointPath = endpointFor.slice(0, -('/__notfound__').length) + '/*/';
      } else if (endpointFor.endsWith('/404')) {
        endpointPath = endpointFor.slice(0, -('/404').length) + '/*/';
      } else {
        endpointPath = endpointFor + '/';
      }

      const file = fs.readFileSync(pathname);
      let fileString = file.toString();
      let template = '';
      fileString = fileString.replaceAll('Pathname', endpointPath);
      fileString = fileString.replace(/(\n)([ \t]*)\/\/ Method Begin\s*?\n([\s\S]*?)\/\/ Method End[ \t]*(\n)/gi, ($0, $1, $2, $3, $4) => {
        template = $2 + $3.trim();
        return `${$1}/* *** */${$4}`;
      });

      const dotenv = require(path.join(process.cwd(), `node_modules`, `dotenv`));
      dotenv.config();
      const endpoint = await import(functionPathname);

      if ('default' in endpoint) {
        methods.push('POST');
      } else {
        ('GET' in endpoint) && methods.push('GET');
        ('POST' in endpoint) && methods.push('POST');
        ('PUT' in endpoint) && methods.push('PUT');
        ('DELETE' in endpoint) && methods.push('DELETE');
      }

      fileString = fileString.replace(
        '/* *** */',
        methods.map(method => {
          return template
            .replaceAll('Method', method)
            .replaceAll('__method__', method === `DELETE` ? `del` : method.toLowerCase());
        }).join('\n\n')
      );

      let newFilename = `test/tests/functions${endpointFor}.mjs`;
      const fileData = Buffer.from(fileString);
      fileWriter.writeFile(newFilename, fileData, false);

      console.log();
      console.log(colors.bold.green(`Success!`) + ` Created tests for "${colors.bold.green(endpointFor)}"!`);
      console.log();

    }

  } catch (e) {
    // If there's an error, write the schema back
    if (existingSchema) {
      const logLevel = Instant._logLevel;
      Instant.enableLogs(0);
      Instant.Migrator.Dangerous.filesystem.writeSchema(existingSchema);
      Instant.enableLogs(logLevel);
    }
    throw e;
  }

  // If complete, write the schema back
  if (existingSchema) {
    const logLevel = Instant._logLevel;
    Instant.enableLogs(0);
    Instant.Migrator.Dangerous.filesystem.writeSchema(existingSchema);
    Instant.enableLogs(logLevel);
  }

  return true;

};
