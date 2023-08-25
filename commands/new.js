const { Command } = require('cmnd');
const Instant = require('@instant.dev/orm')();

const SUPPORTED_OBJECTS = {
  'migration': async (params) => {

  }
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

    let objectName = params.args[0];
    let supported = SUPPORTED_OBJECTS[objectName];
    if (!supported) {
      throw new Error(
        `"${objectName}" is not a valid object to create.\n` +
        `Valid objects are ${Object.keys(SUPPORTED_OBJECTS).join(', ')}.`
      );
    }

    return supported(params);

  }

}

module.exports = NewCommand;
