const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const loadInstant = require('../helpers/load_instant.js');

class InitCommand extends Command {

  constructor() {
    super('init');
  }

  help () {
    return {
      description: 'Initialize a new Instant.dev project with a ["development"]["main"] database',
      args: [],
      flags: {},
      vflags: {
        force: 'overwrites existing migrations and config'
      }
    };
  }

  async run (params) {

    const environment = process.env.NODE_ENV || 'development';
    if (environment !== 'development') {
      throw new Error(`This command can only be used when process.env.NODE_ENV=development`);
    }

    let Instant = await loadInstant();
    if (!Instant) {
      console.log();
      console.log(colors.bold.black(`Installing:`) + ` @instant.dev/orm (latest)...`);
      if ('link' in params.vflags) {
        childProcess.execSync(`npm link @instant.dev/orm`, {stdio: 'inherit'});
      } else {
        childProcess.execSync(`npm i @instant.dev/orm --save`, {stdio: 'inherit'});
      }
      Instant = await loadInstant(true, false);
    }

    Instant.enableLogs(2);

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
    let envCfg = results;

    console.log();

    try {
      await Instant.connect(envCfg, null);
    } catch (e) {
      if (e.message.endsWith(`Database "${envCfg.database}" does not exist.`)) {
        let database = envCfg.database;
        console.log();
        console.log(colors.bold.yellow('Warning: ') + `Database "${database}" does not yet exist.`);
        console.log(`However, you can create it now if you'd like.`);
        console.log();
        let results = await inquirer.prompt([
          {
            name: 'create',
            type: 'confirm',
            message: `Create database "${database}"?`
          }
        ]);
        if (!results['create']) {
          throw new Error(`Aborted. Database "${database}" does not exist.`);
        } else {
          console.log();
          delete envCfg.database;
          Instant.disconnect();
          await Instant.connect(envCfg, null);
          await Instant.database().create(database);
          Instant.disconnect();
          envCfg.database = database;
          await Instant.connect(envCfg, null);
        }
      } else {
        throw e;
      }
    }

    Instant.Config.write('development', 'main', envCfg);
    Instant.Migrator.enableDangerous();
    Instant.Migrator.Dangerous.reset();
    await Instant.Migrator.Dangerous.prepare();
    await Instant.Migrator.Dangerous.initialize();
    Instant.Migrator.disableDangerous();
    Instant.disconnect();

    console.log();
    console.log(colors.bold.green(`Success: `) + `Instant.dev initialized successfully!`);
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

module.exports = InitCommand;
