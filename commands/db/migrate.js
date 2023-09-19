const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class DbMigrateCommand extends Command {

  constructor() {
    super('db', 'migrate');
  }

  help () {
    return {
      description: 'Applies outstanding migrations to database from filesystem',
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
    await Instant.Migrator.Dangerous.migrate();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbMigrateCommand;
