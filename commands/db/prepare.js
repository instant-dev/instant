const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class DbPrepareCommand extends Command {

  constructor() {
    super('db', 'prepare');
  }

  help () {
    return {
      description: 'Prepares database: clears all existing migrations but preserves data',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    Instant.useEnvObject(`.env`);
    let cfg = Instant.Config.read('development', 'main');

    console.log();
    Instant.enableLogs(2);
    try {
      await Instant.connect(cfg, null);
    } catch (e) {
      if (e.message.endsWith(`Database "${cfg.database}" does not exist.`)) {
        console.log(colors.bold.yellow(`Warning:`) + ` Database "${cfg.database}" does not exist... creating...`);
        let database = cfg.database;
        delete cfg.database;
        await Instant.disconnect();
        await Instant.connect(cfg, null);
        await Instant.database().create(database);
        await Instant.disconnect();
        cfg.database = database;
        await Instant.connect(cfg, null);
      } else {
        throw e;
      }
    }
    Instant.Migrator.enableDangerous();
    await Instant.Migrator.Dangerous.prepare();
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbPrepareCommand;
