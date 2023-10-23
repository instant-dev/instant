const { Command } = require('cmnd');

const loadInstant = require('../helpers/load_instant.js');
const verifyPackages = require('../helpers/verify_packages.js');

class VersionCommand extends Command {

  constructor() {
    super('version');
  }

  help () {
    return {
      description: 'Retrieves the current version of installed packages',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    await loadInstant(params, true);
    const verifiedPackages = await verifyPackages();
    console.log(verifiedPackages);

    return void 0;

  }

}

module.exports = VersionCommand;
