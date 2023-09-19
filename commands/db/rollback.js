const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class DbRollbackCommand extends Command {

  constructor() {
    super('db', 'rollback');
  }

  help () {
    return {
      description: 'Rolls back database migrations while maintaining filesystem record',
      args: [],
      flags: {},
      vflags: {steps: 'number of migrations to roll back (default 1)'}
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

    let steps = parseInt(params.vflags['steps']) || 1;

    console.log();
    Instant.enableLogs(2);
    await Instant.connect();
    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.rollback(steps);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbRollbackCommand;
