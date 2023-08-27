const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('inflect');

const argTypeInputs = require('./arg_type_inputs.js');

module.exports = async (Instant, params) => {

  let migration = await Instant.Migrator.create();

  const allowedCommands = migration.constructor.allowedCommands;
  const ignoreCommands = ['setSchema'];
  const commandNames = Object.keys(allowedCommands)
    .filter(cmd => ignoreCommands.indexOf(cmd) === -1);

  console.log();
  console.log(colors.bold.green.underline(`Let's create a new migration!`));
  console.log();
  console.log(`We'll help you generate a new migration file,`);
  console.log(`but don't worry about getting it perfect --`);
  console.log(`you can edit the file before running the migration.`);
  console.log();

  let results = await inquirer.prompt([
    {
      name: 'command',
      type: 'list',
      message: 'Choose a migration command',
      choices: commandNames,
      loop: false
    }
  ]);

  let cmd = results['command'];
  let args = allowedCommands[cmd].map(details => {
    let opts = details.split(':');
    let name = opts[0];
    let type = opts[1];
    let optional = type.startsWith('?');
    type = optional ? type.slice(1) : type;
    return {name, type, optional};
  });

  console.log();
  console.log(`We'll need to enter the following parameters:`);
  console.log(args.map(arg => ` - ${arg.name} (${arg.type})` + (arg.optional ? colors.dim(' [optional]') : '')).join('\n'));

  let insertArgs = [];
  let curTable = null;
  while (args.length) {
    console.log();
    let arg = args.shift();
    if (
      (cmd === 'createTable' && arg.name === 'table') ||
      arg.name === 'newTable'
    ) {
      let valid = false;
      let table;
      while (!valid) {
        let results = await inquirer.prompt([
          {
            name: arg.name,
            type: 'input',
            message: arg.name
          }
        ]);
        table = results[arg.name];
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
              name: arg.name,
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
          table = results[arg.name];
        }
        if (migration._Schema.findTable(table)) {
          console.log();
          console.log(colors.bold.red(`Oops!`) + ` Table "${table}" already exists in your schema.`);
          console.log();
        } else if (!table) {
          console.log();
          console.log(colors.bold.red(`Oops!`) + ` You must enter a table name.`);
          console.log();
        } else {
          valid = true;
        }
      }
      insertArgs.push(curTable = table);
    } else if (arg.name === 'table' || arg.name === 'parentTable') {
      // We're doing something to a table that already exists...
      let tables = Object.keys(migration._Schema.schema.tables);
      if (!tables.length) {
        throw new Error(`Can not run "${cmd}", no tables exist in your schema. Try \`createTable\` first.`);
      }
      let results = await inquirer.prompt([
        {
          name: arg.name,
          type: 'list',
          message: arg.name,
          choices: Object.keys(migration._Schema.schema.tables)
        }
      ]);
      let table = results[arg.name];
      insertArgs.push(curTable = table);
    } else if (argTypeInputs[arg.type]) {
      let result = await argTypeInputs[arg.type](
        Instant.database('main'),
        migration._Schema.schema,
        curTable
      );
      insertArgs.push(result);
    } else {
      throw new Error(`No handler for argument type: "${arg.type}" (generating: ${cmd}[${arg.name}])`);
    }
  }

  console.log(insertArgs);

  return insertArgs;

};
