const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');
const checkMigrationState = require('../../helpers/check_migration_state.js');

class DbStateCommand extends Command {

  constructor() {
    super('db', 'state');
  }

  help () {
    const environment = process.env.NODE_ENV || 'development';
    return {
      description: 'Retrieves the current migration state of the database',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to connect to (default: ${environment})`
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
    const environment = process.env.NODE_ENV || 'development';

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    let env = params.vflags.env || environment;
    let db = 'main';
    let cfg = Instant.Config.read(env, db);

    console.log();
    Instant.enableLogs(2);
    await Instant.connect(cfg);
    Instant.Migrator.enableDangerous();
    await checkMigrationState(Instant, env, environment);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbStateCommand;
