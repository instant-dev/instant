const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');
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

    const Instant = await loadInstant(true);

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
    tmpMigrations.forEach(migration => {
      Instant.Schema.setMigrationId(migration.id);
      migration.up.forEach(command => {
        Instant.Schema[command[0]].apply(Instant.Schema, command.slice(1));
      });
    });
    // Apply changes
    Instant.Schema.update();
    // Now we have correct schema for creating new migrations
    let result = await generateMigration(Instant, params);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = GenerateMigrationCommand;
