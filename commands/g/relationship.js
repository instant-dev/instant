const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');
const generateRelationship = require('../../helpers/generate/relationship/_index.js');

class GenerateRelationshipCommand extends Command {

  constructor() {
    super('g', 'relationship');
  }

  help () {
    return {
      description: 'Generates new relationships: joins models to each other',
      args: ['model_name'],
      flags: {},
      vflags: {}
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
    // Now we have correct schema for creating new migrations
    let result = await generateRelationship(Instant, params);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = GenerateRelationshipCommand;
