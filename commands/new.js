const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const Instant = require('@instant.dev/orm')();

const SUPPORTED_OBJECTS = {
  'migration': async (Instant, params) => {

    let migration = await Instant.Migrator.create();

    const allowedCommands = migration.constructor.allowedCommands;
    const ignoreCommands = ['setSchema'];
    const commandNames = Object.keys(allowedCommands)
      .filter(cmd => ignoreCommands.indexOf(cmd) === -1);

    console.log();
    console.log(colors.bold.green.underline(`Let's create a new migration!`));
    console.log();
    console.log(`We'll help you generate a new migration file,`);
    console.log(`but don't worry about getting it perfect:`);
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
    console.log();

    let insertArgs = [];
    while (args.length) {
      let arg = args.shift();
      switch (arg.type) {
        default:
        case 'string':
          let results = await inquirer.prompt([
            {
              name: arg.name,
              type: 'input',
              message: arg.name
            }
          ]);
          insertArgs.push(results[arg.name]);
          break;
      }
    }

    console.log(insertArgs);

  }
};

class NewCommand extends Command {

  constructor() {
    super('new');
  }

  help () {
    return {
      description: 'Generates new objects.\nSupported object_names are: migration',
      args: ['object_name'],
      flags: {flag: 'An example flag'},
      vflags: {vflag: 'An example verbose flag'}
    };
  }

  async run (params) {

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    let objectName = params.args[0];
    let supported = SUPPORTED_OBJECTS[objectName];
    if (!supported) {
      throw new Error(
        `"${objectName}" is not a valid object to create.\n` +
        `Valid objects are ${Object.keys(SUPPORTED_OBJECTS).join(', ')}.`
      );
    }

    console.log();

    Instant.enableLogs(2);
    await Instant.connect();
    let result = await supported(Instant, params);
    Instant.disconnect();

    console.log();

  }

}

module.exports = NewCommand;
