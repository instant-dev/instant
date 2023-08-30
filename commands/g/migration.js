const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();
const generateMigration = require('../../helpers/generate/migration/_index.js');

class GenerateMigrationCommand extends Command {

  constructor() {
    super('g', 'migration');
  }

  help () {
    return {
      description: 'Generates new migrations. If no name provided, one will be generated automatically.',
      args: ['migration_name'],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

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
    let result = await generateMigration(Instant, params);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = GenerateMigrationCommand;
