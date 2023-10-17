const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');

class DbExtCommand extends Command {

  constructor() {
    super('db', 'ext');
  }

  help () {
    const environment = process.env.NODE_ENV || 'development';
    return {
      description: 'Manages extensions for your database',
      args: ['name'],
      flags: {},
      vflags: {
        enable: `enables the extension`,
        disable: `disables the extension`,
        env: `Environment to connect to (default: ${environment})`
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

    const name = params.args[0] || '';
    if (!name) {
      throw new Error(`Must provide an extension name`);
    }
    const enable = ('enable' in params.vflags);
    const disable = ('disable' in params.vflags);
    if (enable && disable) {
      throw new Error(`Cannot both enable and disable an extension`);
    }

    let env = params.vflags.env || environment;
    let db = 'main';
    const envFile = env === 'development' ? `.env` : `.env.${env}`;
    let cfg = Instant.Config.read(env, db, Instant.readEnvObject(envFile));

    console.log();
    console.log(`Managing extension "${colors.bold.blue(name)}" for environment "${colors.bold(env)}" ...`);
    console.log();

    Instant.enableLogs(2);
    await Instant.connect(cfg, null);
    Instant.Migrator.enableDangerous();

    let extension;
    if (enable) {
      extension = await Instant.Migrator.Dangerous.enableExtension(name);
    } else if (disable) {
      extension = await Instant.Migrator.Dangerous.disableExtension(name);
    } else {
      extension = await Instant.Migrator.Dangerous.getExtension(name);
      console.log();
      console.log(`📦 ${colors.bold.grey('Fetched')} extension "${colors.bold.blue(extension.name)}" for database in "${colors.bold(env)}" ...`);
    }

    if (!extension) {
      throw new Error(`Could not find extension "${name}" installed`);
    }

    console.log();
    console.log(extension);
    console.log();

    if (enable) {
      console.log(`✅ ${colors.bold.green('Enabled')} extension "${colors.bold.blue(extension.name)}" for database in "${colors.bold(env)}"`);
    } else if (disable) {
      console.log(`❌ ${colors.bold.red('Disabled')} extension "${colors.bold.blue(extension.name)}" for database in "${colors.bold(env)}"`);
    }

    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = DbExtCommand;
