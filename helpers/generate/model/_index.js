const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('i')();

const argTypeInputs = require('../arg_type_inputs.js');
const checkMigrationState = require('../../check_migration_state.js');

module.exports = async (Instant, params) => {

  let name = inflect.underscore(params.args[0] || '');
  let migration = await Instant.Migrator.createUnsafe();

  console.log();
  console.log(colors.bold.green.underline(`Let's create a new model!`));
  console.log();
  console.log(`This will create a new ${colors.bold('migration')} with a "createTable" command,`);
  console.log(`As well as a new ${colors.bold('model')} extension.`);
  console.log();

  let valid = false;
  let table = name || null;
  while (!valid) {
    let results = await inquirer.prompt([
      {
        name: 'table',
        type: 'input',
        message: 'table',
        default: table
      }
    ]);
    table = results['table'];
    let tableized = inflect.underscore(inflect.pluralize(table));
    if (table !== tableized) {
      console.log();
      console.log(colors.bold.yellow(`Warning:`));
      console.log(`We recommend using plural, snake_cased names for tables as convention.`);
      console.log(`You can use the name ${colors.yellow.bold(table)} for your table,`);
      console.log(`but we recommend using ${colors.green.bold(tableized)}.`);
      console.log();
      let results = await inquirer.prompt([
        {
          name: 'table',
          type: 'list',
          message: 'Which table name will you use?',
          choices: [
            {
              name: `${tableized} ${colors.green(`(recommended)`)}`,
              value: tableized
            },
            {
              name: `${table} ${colors.yellow(`(original)`)}`,
              value: table,
            },
            {
              name: `neither ${colors.dim(`(re-enter)`)}`,
              value: null
            }
          ],
          loop: false
        }
      ]);
      table = results['table'];
    }
    if (migration._Schema.findTable(table)) {
      console.log();
      console.log(colors.bold.red(`Oops!`) + ` Table "${table}" already exists in your schema.`);
      console.log();
      table = null;
    } else if (!table) {
      console.log();
      console.log(colors.bold.red(`Oops!`) + ` You must enter a table name.`);
      console.log();
      table = null;
    } else {
      valid = true;
    }
  }

  console.log();

  let columns = await argTypeInputs['column[]'](
    Instant.database('main'),
    migration._Schema.schema,
    table,
    null
  );

  console.log();

  migration.createTable(table, columns);
  Instant.Migrator.Dangerous.filesystem.write(migration);
  Instant.Generator.extend(table);

  console.log();
  console.log(colors.bold.green(`Successfully created model "${table}"!`));
  console.log();

  await checkMigrationState(Instant);

  return true;

};
