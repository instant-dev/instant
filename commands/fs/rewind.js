const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class FsRewindCommand extends Command {

  constructor() {
    super('fs', 'rewind');
  }

  help () {
    return {
      description: 'Rewinds (removes) filesystem migrations that are not in the database',
      args: [],
      flags: {},
      vflags: {steps: 'number of migrations to remove (default 1)'}
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

    let steps = parseInt(params.vflags['steps']) || 1;

    console.log();
    Instant.enableLogs(2);
    await Instant.connect();
    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.filesystem.rewind(steps);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = FsRewindCommand;
