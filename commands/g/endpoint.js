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
      description: 'Generates a new set of endpoints for a model',
      args: [],
      flags: {},
      vflags: {
        'for': 'The model which you are generating the endpoint for'
      }
    };
  }

  async run (params) {

    const Instant = loadInstant(true);

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
    Instant.enableLogs(2);
    // Do not load a schema
    await Instant.connect(null, null);
    Instant.Migrator.enableDangerous();
    // Run each filesystem migration to emulate schema state
    const tmpMigrations = Instant.Migrator.Dangerous.filesystem.getMigrations();
    tmpMigrations.forEach(migration => {
      Instant.Schema.setMigrationId(migration.id);
      migration.up.forEach(command => {
        Instant.Schema[command[0]].apply(Instant.Schema, command.slice(1));
      });
    });
    // Apply changes
    Instant.Schema.update();
    // Now we have correct schema for creating new endpoints
    let result = await generateEndpoint(Instant, params);

  }

}

module.exports = GenerateEndpointCommand;