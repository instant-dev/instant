const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');
const checkMigrationState = require('../../helpers/check_migration_state.js');

class DbStateCommand extends Command {

  constructor() {
    super('db', 'state');
  }

  help () {
    return {
      description: 'Retrieves the current migration state of the database',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const Instant = loadInstant(true);

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    console.log();
    Instant.enableLogs(2);
    await Instant.connect();
    Instant.Migrator.enableDangerous();
    await checkMigrationState(Instant);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbStateCommand;
