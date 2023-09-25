const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('i')();

const argTypeInputs = require('../arg_type_inputs.js');
const checkMigrationState = require('../../check_migration_state.js');

module.exports = async (Instant, params) => {

  let parentTable = inflect.underscore(inflect.pluralize(params.args[0] || ''));
  let table = inflect.underscore(inflect.pluralize(params.args[1] || ''));
  let migration = await Instant.Migrator.createUnsafe();

  console.log();
  console.log(colors.bold.green.underline(`Let's create a new relationship!`));
  console.log();
  console.log(`This will create a new ${colors.bold('migration')} with the following commands:`);
  console.log(`addColumn(table, column, type, {"unique": true | false})`);
  console.log(`createForeignKey(table, column, parentTable, parentColumn)`);
  console.log();

  let tables = Object.keys(migration._Schema.schema.tables);
  if (tables.length < 2) {
    throw new Error(`You must have at least two (2) tables to create a relationship.`);
  }

  let tablePrompts = [];
  if (!parentTable) {
    let tableResults = await inquirer.prompt([
      {
        name: 'parentTable',
        type: 'list',
        message: 'Parent table: This table "owns" all children\nparentTable',
        choices: tables
      }
    ]);
    parentTable = tableResults['parentTable'];
    console.log();
  }
  if (!table) {
    let tableResults = await inquirer.prompt([
      {
        name: 'table',
        type: 'list',
        message: 'Child table: If parent is destroyed, these are orphaned\ntable',
        choices: tables.filter(t => t !== parentTable)
      }
    ]);
    table = tableResults['table'];
    console.log();
  }

  let parentModel = migration._Schema.findTable(parentTable, true);
  let model = migration._Schema.findTable(table, true);

  let parentColumn;
  let column;
  let valid = false;
  while (!valid) {
    if (!parentColumn) {
      let results = await inquirer.prompt([
        {
          name: 'parentColumn',
          type: 'list',
          message: `Parent column: "${parentTable}" column that child references\nparentColumn`,
          choices: parentModel.columns.map(c => {
            return {
              name: `"${parentTable}"."${c.name}"`,
              value: c.name
            };
          }),
          default: 'id'
        }
      ]);
      parentColumn = results['parentColumn'];
    }
    console.log();
    results = await inquirer.prompt([
      {
        name: 'column',
        type: 'input',
        message: `Child column: New column name on "${table}" that references "${parentTable}"."${parentColumn}"\ncolumn`,
        default: `${inflect.singularize(parentTable)}_${parentColumn}`,
        validate: v => !!v
      }
    ]);
    column = results['column'];
    if (model.columns.find(c => c.name === column)) {
      console.log();
      console.log(colors.bold.red(`Oops!`) + ` Table "${table}" already has column "${column}"`);
      console.log();
      valid = false;
    } else {
      console.log();
      valid = true;
    }
  }

  let foundColumn = parentModel.columns.find(c => c.name === parentColumn);
  let type = (Instant.database().adapter.simpleTypes[foundColumn.type] || {dbName: foundColumn.type}).dbName;

  results = await inquirer.prompt([
    {
      name: 'unique',
      type: 'list',
      message: `What type of relationship do these tables have?`,
      choices: [
        {name: `One-to-One: 1 ${parentTable} to 1 ${table}`, value: true},
        {name: `One-to-Many: 1 ${parentTable} to many ${table}`, value: false}
      ],
      default: true
    }
  ]);

  let unique = results['unique'];

  console.log();

  await migration.addColumn(table, column, type, {unique});
  await migration.createForeignKey(table, column, parentTable, parentColumn);

  Instant.Migrator.Dangerous.filesystem.write(migration);

  console.log();
  console.log(colors.bold.green(`Successfully created relationship!`));
  console.log();

  await checkMigrationState(Instant);

  return true;

};
