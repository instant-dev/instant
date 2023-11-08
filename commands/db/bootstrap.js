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

    const Instant = await loadInstant(params, true);

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    let cfg = Instant.Config.read('development', 'main', Instant.readEnvObject(`.env`));

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
    const seed = Instant.Migrator.Dangerous.filesystem.readSeed();
    await Instant.Migrator.Dangerous.bootstrap(seed);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbBootstrapCommand;
