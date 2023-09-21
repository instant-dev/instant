const { Command } = require('cmnd');
const colors = require('colors/safe');
const childProcess = require('child_process');

const loadInstant = require('../helpers/load_instant.js');

class SqlCommand extends Command {

  constructor() {
    super('sql');
  }

  help () {
    const environment = process.env.NODE_ENV || 'development';
    return {
      description: 'Connects to psql',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to connect to (default: ${environment})`,
        db: 'Database alias to connect to (default: main)'
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(true);
    const environment = process.env.NODE_ENV || 'development';

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    let env = params.vflags.env || environment;
    let db = params.vflags.db || 'main';
    let cfg = Instant.Config.read(env, db);

    console.log();
    console.log(`Connecting to SQL interface for _instant/db.json["${env}"]["${db}"] ...`);
    console.log();

    let psqlCommand;

    if (cfg.tunnel) {
      Instant.enableLogs(2);
      let tunnelResult = await Instant.tunnel(cfg);
      console.log();
      let config = tunnelResult.config;
      psqlCommand = (
        cfg.connectionString
          ? `psql ${config.connectionString}`
          : (
              config.password
                ? `PGPASSWORD=${config.password} `
                : ``
            ) + `psql -U ${config.user} -h ${config.host} -p ${config.port} -d ${config.database}`
      );
    } else {
      psqlCommand = (
        cfg.connectionString
          ? `psql ${cfg.connectionString}`
          : (
              cfg.password
                ? `PGPASSWORD=${cfg.password} `
                : ``
            ) + `psql -U ${cfg.user} -h ${cfg.host} -p ${cfg.port} -d ${cfg.database}`
      );
    }

    childProcess.spawn(psqlCommand, {stdio: 'inherit', shell: true});
    while (true) {
      await new Promise(r => setTimeout(() => r(), 1000));
    }

    return void 0;

  }

}

module.exports = SqlCommand;
