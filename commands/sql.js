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
        db: 'Database alias to connect to (default: main)',
        'no-db': 'Connects to psql without a database'
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
    const environment = process.env.NODE_ENV || 'development';

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    const env = (params.vflags.env || [])[0] || environment;
    const db = params.vflags.db || 'main';
    let cfg = Instant.Config.read(env, db);

    console.log();
    console.log(`Connecting to SQL environment "${colors.bold.green(env)}" using credentials _instant/db.json["${env}"]["${db}"] ...`);
    console.log();

    let psqlCommand;
    let useDb = !params.vflags['no-db'];

    const Adapter = Instant.constructor.Core.DB.Database.getDefaultAdapter();
    const parseConfig = Adapter.prototype.parseConfig.bind(Adapter.prototype);

    if (cfg.tunnel) {
      Instant.enableLogs(2);
      let tunnelResult = await Instant.tunnel(cfg);
      console.log();
      cfg = parseConfig(tunnelResult.config);
    } else {
      cfg = parseConfig(cfg);
    }
    psqlCommand = `psql postgres://${cfg.user}:${cfg.password}@${cfg.host}:${cfg.port}/${cfg.database || ''}${cfg.ssl ? '?sslmode=require' : ''}`;
    childProcess.spawn(psqlCommand, {stdio: 'inherit', shell: true});
    while (true) {
      await new Promise(r => setTimeout(() => r(), 1000));
    }

    return void 0;

  }

}

module.exports = SqlCommand;
