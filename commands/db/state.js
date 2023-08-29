const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();

class DbStateCommand extends Command {

  constructor() {
    super('db', 'state');
  }

  help () {
    return {
      description: 'Retrieves the current migration state of the database',
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
    let state = await Instant.Migrator.Dangerous.getMigrationState();
    let diffs = await Instant.Migrator.Dangerous.getTextDiffs();

    console.log();
    console.log(`Your current migration state is: ${colors.bold.blue(state.status)}`);
    console.log();
    console.log(diffs);
    console.log();

    if (state.status === 'synced') {
      console.log(`Everything looks up-to-date on migrations!`);
    } else if (state.status === 'filesystem_ahead') {
      console.log(`To apply outstanding migrations:`);
      console.log();
      console.log(colors.bold.grey(`\t$ instant db:migrate`));
    } else {
      console.log(`To rollback the database to last synced point and apply outstanding migrations:`);
      console.log();
      console.log(colors.bold.grey(`\t$ instant db:rollbackSync`));
      console.log(colors.bold.grey(`\t$ instant db:migrate`));
    }
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbStateCommand;
