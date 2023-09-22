const { Command } = require('cmnd');
const colors = require('colors/safe');
const childProcess = require('child_process');

const loadInstant = require('../helpers/load_instant.js');
const checkMigrationState = require('../helpers/check_migration_state.js');
const fileWriter = require('../helpers/file_writer.js');

class DeployCommand extends Command {

  constructor() {
    super('deploy');
  }

  help () {
    return {
      description: 'Deploys a project using your framework of choice',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to deploy to`,
      }
    };
  }

  printRecommendedEnvironments (framework) {
    if (framework === 'vercel') {
      return `Available environments for "vercel" are:\n` +
        `preview, production`;
    } else if (framework === 'autocode') {
      return `Recommended environments for "autocode" are:\n` +
        `staging, release`;
    } else {
      return `Recommended environments are:\n` +
        `staging, production`;
    }
  }

  async run (params) {

    const Instant = await loadInstant(true);
    const environment = process.env.NODE_ENV || 'development';
    const framework = fileWriter.determineFramework();

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    const env = ((params.vflags.env || [])[0] || '').trim();

    if (!env) {
      throw new Error(
        `Must specify environment with --env [environment].\n` +
        this.printRecommendedEnvironments(framework)
      );
    } else if (env === 'development') {
      throw new Error(
        `Can not deploy to "development": it is a local environment`
      );
    } else if (env === 'local') {
      throw new Error(
        `Can not deploy to "local": "development" is the local environment, and can not be deployed to`
      )
    }

    /**
     * Framework-specific deploy environment restrictions
     */
    if (framework === 'vercel') {
      if (env !== 'preview' && env !== 'production') {
        throw new Error(`Only valid environments for framework "vercel" are: preview, production`);
      }
    } else if (framework === 'autocode') {
      // do nothing
    } else {
      throw new Error(
        `Framework "${framework}" deployments not yet supported.\n` +
        `You should run \`instant db:migrate --env ${env}\`,\n` +
        `and then use your manual deployment method.`
      );
    }

    const cfg = Instant.Config.read(env, 'main');

    console.log();
    console.log(colors.bold(`Migrating:`) + ` project via "${colors.bold.green(framework)}" to environment "${colors.bold.green(env)}"...`);
    console.log();

    Instant.enableLogs(2);
    await Instant.connect();
    Instant.Migrator.enableDangerous();
    let canMigrate = await checkMigrationState(Instant);
    if (!canMigrate) {
      throw new Error(`Your local migration state must be up to date to deploy`);
    }
    console.log();
    Instant.Migrator.disableDangerous();
    Instant.disconnect();

    console.log();
    console.log(`Connecting to "${colors.bold.green(env)}" database ...`);
    console.log();

    await Instant.connect(cfg);
    Instant.Migrator.enableDangerous();

    console.log();
    console.log(`Retrieving "${colors.bold.green(env)}" migration state ...`);
    console.log();

    let state = await Instant.Migrator.Dangerous.getMigrationState();
    let diffs = await Instant.Migrator.Dangerous.getTextDiffs();

    console.log(`Current migration state for "${colors.bold.green(env)}" is: ${colors.bold.blue(state.status)}`);
    console.log();
    console.log(diffs);
    console.log();

    if (
      state.status !== 'synced' &&
      state.status !== 'filesystem_ahead'
    ) {
      console.log(`To rollback the database to last synced point and apply outstanding migrations:`);
      console.log();
      console.log(colors.bold.grey(`\t$ instant db:rollbackSync --env ${checkEnv}`));
      console.log(colors.bold.grey(`\t$ instant db:migrate --env ${checkEnv}`));
      throw new Error(`Can only deploy when remote state is "synced" or "filesystem_ahead"`);
    } else if (state.status === 'filesystem_ahead') {
      await Instant.Migrator.Dangerous.migrate();
    }

    Instant.Migrator.disableDangerous();
    Instant.disconnect();
    console.log();
    console.log(colors.bold(`Deploying:`) + ` Running "${colors.bold.green(framework)}" deploy script for "${colors.bold.green(env)}"...`);

    /**
     * Framework-specific deploy commands
     */
    if (framework === 'vercel') {
      console.log();
      if (env === 'production') {
        childProcess.spawnSync(`vercel --prod`, {stdio: 'inherit', shell: true});
      } else {
        childProcess.spawnSync(`vercel`, {stdio: 'inherit', shell: true});
      }
    } else if (framework === 'autocode') {
      if (env === 'release') {
        childProcess.spawnSync(`lib release`, {stdio: 'inherit', shell: true});
      } else {
        childProcess.spawnSync(`lib up ${env}`, {stdio: 'inherit', shell: true});
      }
    }

    return void 0;

  }

}

module.exports = DeployCommand;
