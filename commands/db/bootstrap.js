const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class DbBootstrapCommand extends Command {

  constructor() {
    super('db', 'bootstrap');
  }

  help () {
    return {
      description: 'Bootstraps database: empties database, runs all filesystem migrations, then seeds data',
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
    await Instant.Migrator.Dangerous.bootstrap();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbBootstrapCommand;
