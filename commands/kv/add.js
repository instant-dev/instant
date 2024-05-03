const { Command } = require('cmnd');

const loadInstant = require('../../helpers/load_instant.js');
const addKV = require('../../helpers/add_kv.js');

class KVAddCommand extends Command {

  constructor() {
    super('kv', 'add');
  }

  help () {
    return {
      description: 'Adds a new key-value store to an environment',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to associate remote key-value store with`,
        db: 'Key-value store alias to connect to (default: main)'
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
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
    } else if (env === 'local') {
      throw new Error(
        `Local databases use the "development" environment.\n`,
        `If you'd like to chang the "development" database, try running \`instant kv:add --env development\` instead.`
      )
    }

    Instant.enableLogs(2);
    Instant.useEnvObject(`.env`); // load env vars to not blow a gasket
    await addKV(Instant, env, db);

    return void 0;

  }

}

module.exports = KVAddCommand;
