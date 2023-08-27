const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();

class FsFastForwardCommand extends Command {

  constructor() {
    super('fs', 'fastForward');
  }

  help () {
    return {
      description: 'Pulls missing filesystem migrations from database',
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
    await Instant.Migrator.Dangerous.filesystem.fastForward();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = FsFastForwardCommand;
