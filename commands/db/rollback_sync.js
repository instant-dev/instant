const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();

class DbRollbackCommand extends Command {

  constructor() {
    super('db', 'rollbackSync');
  }

  help () {
    return {
      description: 'Rolls back database migrations to last matching filesystem migration',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

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
    await Instant.Migrator.Dangerous.rollbackSync();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbRollbackCommand;
