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
      flags: {},
      vflags: {force: 'Force initialization of an Instant.dev project'}
    };
  }

  async run (params) {

    const force = ('force' in params.vflags);

    if (!force && Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has already been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `You can force a new initialization with:\n\n` +
        colors.grey.bold(`\t$ instant init --force\n\n`) +
        `which will reset your migrations but preserve your database.\n\n` +
        `If you simply want to reset your data, run:\n\n` +
        colors.grey.bold(`\t$ instant db:bootstrap\n\n`) +
        `which will empty your database, re-run all migrations, and seed your data.`
      );
    }

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

    let envCfg = results;

    try {
      await Instant.connect(envCfg);
    } catch (e) {
      throw new Error(`Could not connect to database: ${e.message}`);
    }

    Instant.enableLogs(2);
    Instant.Config.write('development', 'main', envCfg);
    Instant.Migrator.enableDangerous();
    Instant.Migrator.Dangerous.reset();
    await Instant.Migrator.Dangerous.prepare();
    await Instant.Migrator.Dangerous.initialize();
    Instant.Migrator.disableDangerous();

    console.log();
    console.log(colors.bold.green(`Instant.dev initialized successfully!`));
    console.log();
    console.log(`You can create a new migration with:`);
    console.log();
    console.log(
      colors.grey.bold(
        `\t$ instant new migration`
      )
    );
    console.log();
    console.log(`Please visit [URL] for more information about using Instant.dev.`);
    console.log(colors.green.bold(`Happy building! :)`));
    console.log();

    return void 0;

  }

}

module.exports = NewCommand;
