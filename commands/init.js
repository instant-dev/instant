const { Command } = require('cmnd');
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

    console.log(`Welcome to Instant.dev!`);
    console.log(`To get started, we need to connect to your local Postgres instance.`);
    console.log(`If you haven't set one up yet, please visit [URL].`);

    console.log('\nPlease enter your local Postgres credentials:');

    let results = await inquirer.prompt([
      {
        type: 'input',
        message: 'host',
        default: 'localhost'
      }
    ]);

    return results;

  }

}

module.exports = NewCommand;
