const { Command } = require('cmnd');

const loadInstant = require('../../helpers/load_instant.js');
const addDatabase = require('../../helpers/add_database.js');

class DbAddCommand extends Command {

  constructor() {
    super('db', 'add');
  }

  help () {
    return {
      description: 'Adds a new remote database to an environment',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to associate remote database with`,
        db: 'Database alias to connect to (default: main)'
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
    Instant.Plugins.disable();
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
    } else if (env === 'local') {
      throw new Error(
        `Local databases use the "development" environment.\n`,
        `If you'd like to chang the "development" database, try running \`instant init\` instead.`
      )
    }

    Instant.enableLogs(2);
    Instant.useEnvObject(`.env`); // load env vars to not blow a gasket
    await addDatabase(Instant, env, db);

    return void 0;

  }

}

module.exports = DbAddCommand;
