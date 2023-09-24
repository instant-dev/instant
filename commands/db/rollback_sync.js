const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class DbRollbackSyncCommand extends Command {

  constructor() {
    super('db', 'rollbackSync');
  }

  help () {
    const environment = process.env.NODE_ENV || 'development';
    return {
      description: 'Rolls back database migrations to last synced filesystem migration',
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

    if (env === 'development') {
      let hasMigrationsEnabled = await Instant.Migrator.isEnabled();
      if (!hasMigrationsEnabled) {
        throw new Error(
          `Your local database does not have migrations enabled.\n` +
          `This is usually caused by cloning a project you haven't set up a database for yet.\n` +
          `Run \`instant db:prepare\` to set up your database or \`instant db:bootstrap\` to bootstrap your database.`
        );
      }
    }

    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.rollbackSync();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbRollbackSyncCommand;
