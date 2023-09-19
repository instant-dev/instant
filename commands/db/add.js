const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const loadInstant = require('../../helpers/load_instant.js');

class DbAddCommand extends Command {

  constructor() {
    super('db', 'add');
  }

  help () {
    return {
      description: 'Adds a new database to an environment',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to connect to`,
        db: 'Database alias to connect to (default: main)'
      }
    };
  }

  async run (params) {

    const environment = process.env.NODE_ENV || 'development';
    if (environment !== 'development') {
      throw new Error(`This command can only be used when process.env.NODE_ENV=development`);
    }

    const env = (params.vflags.env || [])[0];
    const db = (params.vflags.db || [])[0] || 'main';
    if (!env) {
      throw new Error(
        `Must specify environment with --env.\n` +
        `Recommended environment names are: staging, preview, production`
      );
    } else if (env === 'development') {
      throw new Error(
        `Can not change "development" database.\n` +
        `Try running \`instant init\` instead.`
      );
    }

    const Instant = loadInstant(true);

    Instant.enableLogs(2);

    console.log();

    let connectResults = await inquirer.prompt([
      {
        name: 'inputType',
        type: 'list',
        message: 'How would you like to connect to this database?',
        choices: [
          {
            name: 'Connection string (e.g. postgres://[...])',
            value: 'connectionString'
          },
          {
            name: 'Enter manually: host / port / user / password / database',
            value: 'manual'
          }
        ],
        loop: false
      }
    ]);

    let envCfg;
    if (connectResults['inputType'] === 'connectionString') {
      const connectRE = /postgres\:\/\/(\w+)(?:\:(.*))?@([a-z0-9\-\.]+):(\d+)\/([a-z0-9\-\_]+)/gi;
      let results = await inquirer.prompt([
        {
          name: 'connectionString',
          type: 'input',
          message: 'connectionString',
          default: '',
          validate: str => {
            if (str.match(connectRE)) {
              return true;
            } else {
              return 'Must match: postgres://user:password@url.to.database:port/database';
            }
          }
        }
      ]);
      results.connectionString = results.connectionString.match(connectRE)[0];
      envCfg = results;
    } else {
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
      envCfg = results;
    }

    console.log();

    try {
      await Instant.connect(envCfg, null);
    } catch (e) {
      if (e.message.startsWith('connection is insecure')) {
        if (envCfg.connectionString) {
          envCfg.connectionString += '?ssl=true';
        } else {
          envCfg.ssl = true;
        }
        await Instant.connect(envCfg, null);
      } else if (e.message.endsWith(`Database "${envCfg.database}" does not exist.`)) {
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

    Instant.Config.write(env, db, envCfg);

    console.log();
    console.log(colors.bold.green(`Success: `) + `_instant/db.json["${env}"]["${db}"] added successfully!`);
    console.log();

    return void 0;

  }

}

module.exports = DbAddCommand;
