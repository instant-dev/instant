const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

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

    const Instant = await loadInstant(true);

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

    let hasMigrationsEnabled = await Instant.Migrator.isEnabled();
    if (!hasMigrationsEnabled) {
      throw new Error(
        `Your local database does not have migrations enabled.\n` +
        `This is usually caused by cloning a project you haven't set up a database for yet.\n` +
        `Run \`instant db:prepare\` to set up your database or \`instant db:bootstrap\` to bootstrap your database.`
      );
    }

    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.filesystem.rewindSync();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = FsRewindSyncCommand;
