const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class DbPrepareCommand extends Command {

  constructor() {
    super('db', 'prepare');
  }

  help () {
    return {
      description: 'Prepares database for new migrations by clearing all existing migrations',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const Instant = await loadInstant(true);

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    console.log();
    Instant.enableLogs(2);
    await Instant.connect(null, null);
    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.prepare();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbPrepareCommand;
