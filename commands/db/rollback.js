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

    const Instant = await loadInstant(true);

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

    let hasMigrationsEnabled = await Instant.Migrator.isEnabled();
    if (!hasMigrationsEnabled) {
      throw new Error(
        `Your local database does not have migrations enabled.\n` +
        `This is usually caused by cloning a project you haven't set up a database for yet.\n` +
        `Run \`instant db:prepare\` to set up your database or \`instant db:bootstrap\` to bootstrap your database.`
      );
    }

    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.rollback(steps);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbRollbackCommand;
