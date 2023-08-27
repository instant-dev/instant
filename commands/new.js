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
    await Instant.connect();
    let result = await supported(Instant, params);
    Instant.disconnect();

    console.log();

  }

}

module.exports = NewCommand;
