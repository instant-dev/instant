const { Command } = require('cmnd');
const colors = require('colors/safe');

const Instant = require('@instant.dev/orm')();
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

    // Now we have correct schema for creating new migrations
    let result = await generateEndpoint(Instant, params);

  }

}

module.exports = GenerateEndpointCommand;
