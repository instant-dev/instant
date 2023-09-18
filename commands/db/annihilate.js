const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();

class DbAnnihilateCommand extends Command {

  constructor() {
    super('db', 'annihilate');
  }

  help () {
    return {
      description: 'Truncates the existing database. Use with extreme caution.',
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
    await Instant.connect(null, null);
    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.annihilate();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbAnnihilateCommand;
