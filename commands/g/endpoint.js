const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');
const generateEndpoint = require('../../helpers/generate/endpoint/_index.js');

class GenerateEndpointCommand extends Command {

  constructor() {
    super('g', 'endpoint');
  }

  help () {
    return {
      description: 'Generates a new set of endpoints for a model, can provide a namespace to put inside a directory',
      args: ['namespace'],
      flags: {},
      vflags: {
        'for': 'Model which you are generating the endpoint for',
        'blank': 'Create a blank endpoint'
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);

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

    const env = environment;
    const db = 'main';
    let cfg = Instant.Config.read(env, db, Instant.readEnvObject(`.env`));

    Instant.enableLogs(2);
    // Do not load a schema
    await Instant.connect(cfg, null);

    let hasMigrationsEnabled = await Instant.Migrator.isEnabled();
    if (!hasMigrationsEnabled) {
      throw new Error(
        `Your local database does not have migrations enabled.\n` +
        `This is usually caused by cloning a project you haven't set up a database for yet.\n` +
        `Run \`instant db:prepare\` to set up your database or \`instant db:bootstrap\` to bootstrap your database.`
      );
    }

    Instant.Migrator.enableDangerous();
    // Run each filesystem migration to emulate schema state
    const tmpMigrations = Instant.Migrator.Dangerous.filesystem.getMigrations();
    for (const migration of tmpMigrations) {
      Instant.Schema.setMigrationId(migration.id);
      for (const command of migration.up) {
        await Instant.Schema[command[0]].apply(Instant.Schema, command.slice(1));
      }
    }
    // Apply changes
    await Instant.Schema.update();
    // Now we have correct schema for creating new endpoints
    let result = await generateEndpoint(Instant, params);

  }

}

module.exports = GenerateEndpointCommand;
