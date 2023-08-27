const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();

const SUPPORTED_OBJECTS = {
  'migration': require('../helpers/create/migration/_index.js')
};

class NewCommand extends Command {

  constructor() {
    super('new');
  }

  help () {
    return {
      description: 'Generates new objects.\nSupported object_names are: migration',
      args: ['object_name'],
      flags: {flag: 'An example flag'},
      vflags: {vflag: 'An example verbose flag'}
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

    let objectName = params.args[0];
    let supported = SUPPORTED_OBJECTS[objectName];
    if (!supported) {
      throw new Error(
        `"${objectName}" is not a valid object to create.\n` +
        `Valid objects are ${Object.keys(SUPPORTED_OBJECTS).join(', ')}.`
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
    let result = await supported(Instant, params);
    Instant.Migrator.disableDangerous();
    console.log();

  }

}

module.exports = NewCommand;
