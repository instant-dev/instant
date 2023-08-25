const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const Instant = require('@instant.dev/orm')();

class NewCommand extends Command {

  constructor() {
    super('init');
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

    console.log();
    console.log(`Welcome to ${colors.green.bold('Instant.dev')}!`);
    console.log();
    console.log(`To get started, we need to connect to your local Postgres instance.`);
    console.log(`If you haven't set one up yet, please visit [URL].`);
    console.log();

    console.log('Please enter your local Postgres credentials:');

    let results = await inquirer.prompt([
      {
        name: 'host',
        type: 'input',
        message: 'host',
        default: 'localhost'
      },
      {
        name: 'port',
        type: 'input',
        message: 'port',
        default: '5432'
      },
      {
        name: 'user',
        type: 'input',
        message: 'user',
        default: 'postgres'
      },
      {
        name: 'password',
        type: 'input',
        message: 'password',
        default: ''
      },
      {
        name: 'database',
        type: 'input',
        message: 'database',
        default: 'postgres'
      }
    ]);

    console.log();

    let cfg = {};
    cfg['local'] = results;

    try {
      await Instant.connect(cfg['local']);
    } catch (e) {
      throw new Error(`Could not connect to database: ${e.message}`);
    }

    Instant.Migrator.enableDangerous();
    Instant.enableLogs(2);

    Instant.Migrator.Dangerous.reset();
    await Instant.Migrator.Dangerous.prepare();
    await Instant.Migrator.Dangerous.initialize();

    return void 0;

  }

}

module.exports = NewCommand;
