const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadInstant = require('../../helpers/load_instant.js');
const generateTest = require('../../helpers/generate/test/_index.js');

class GenerateTestCommand extends Command {

  constructor() {
    super('g', 'test');
  }

  help () {
    return {
      description: 'Generates new test',
      args: ['test_name'],
      flags: {},
      vflags: {
        for: 'Generate a test for a model',
        function: 'Generate a test for an endpoint'
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

    let specificity = [params.args[0], params.vflags.for, params.vflags.function];
    let submitted = specificity.filter(v => v);
    if (!submitted.length) {
      throw new Error(`Must specify one of "test_name", "--for" or "--function"`);
    } else if (submitted.length > 1) {
      throw new Error(`Can only specify one of "test_name", "--for" or "--function"`);
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
    let result = await generateTest(Instant, params);
    Instant.Migrator.disableDangerous();

  }

}

module.exports = GenerateTestCommand;
