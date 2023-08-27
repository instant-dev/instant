const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();

class FsRewindSyncCommand extends Command {

  constructor() {
    super('fs', 'rewindSync');
  }

  help () {
    return {
      description: 'Rewinds (removes) filesystem migrations to the last synced database migration',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const environment = process.env.NODE_ENV || 'development';
    if (environment !== 'development') {
      throw new Error(`This command can only be used when process.env.NODE_ENV=development`);
    }

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
    await Instant.Migrator.Dangerous.filesystem.rewindSync();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = FsRewindSyncCommand;
