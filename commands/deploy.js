const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const commandExists = require('command-exists').sync;

const fs = require('fs');
const path = require('path');
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
      description: 'Deploys a project using your host of choice',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to deploy to`,
      }
    };
  }

  printRecommendedEnvironments (deployTarget) {
    if (deployTarget === 'vercel') {
      return `Available environments for "vercel" are:\n` +
        `preview, production`;
    } else {
      return `Recommended environments are:\n` +
        `staging, production`;
    }
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
    const environment = process.env.NODE_ENV || 'development';
    let deployTarget = fileWriter.determineDeployTarget();

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    if (!fs.existsSync('instant.mjs')) {
      throw new Error(
        `Can not deploy Instant API: Could not find "instant.mjs" in your root directory.\n` +
        `\n` +
        `If you're just using Instant ORM you should run:\n\n` + 
        `    instant db:migrate --env [env]\n\n` +
        `and then use your manual deployment method.`
      );
    }

    let configTarget = Instant.readEnvKey('.deployconfig', 'TARGET');
    if (!configTarget) {
      console.log();
      console.log(`👀 We can see you haven't deployed before!`);
      if (deployTarget !== 'default') {
        configTarget = deployTarget;
        console.log(`✨ We've automatically determined you should be deploying to "${colors.bold.green(deployTarget)}" ...`);
        console.log();
      } else {
        console.log(`❓ Please pick a deployment target`);
        console.log();
        let deployQuery = await inquirer.prompt([
          {
            name: 'target',
            type: 'list',
            message: `Where would you like to host your project?`,
            default: true,
            choices: [
              {
                name: `Vercel`,
                value: `vercel`
              }
            ]
          }
        ]);
        configTarget = deployQuery.target;
      }
      if (configTarget === 'vercel') {
        if (!commandExists('vercel')) {
          childProcess.execSync(`npm i -g vercel@latest`, {stdio: 'inherit'});
        }
        if (deployTarget !== 'vercel') {
          const result = childProcess.spawnSync(`vercel link`, {stdio: 'inherit', shell: true});
          if (!fs.existsSync('.vercel')) {
            throw new Error(`Framework initialization aborted`);
          }
          console.log();
          if (result.signal === 'SIGINT') {
            process.exit(2)
          }
        }
      } else {
        throw new Error(`Unsupported deploy target: "${configTarget}`);
      }
      deployTarget = configTarget;
      const srcRoot = path.join(__dirname, '..', 'src');
      const deployFilesRoot = path.join(srcRoot, 'deploy', deployTarget);
      if (fs.existsSync(deployFilesRoot)) {
        const files = fileWriter.readRecursive(deployFilesRoot);
        for (const filename in files) {
          fileWriter.writeFile(filename, files[filename], false);
        }
      }
      Instant.writeEnv('.deployconfig', 'TARGET', deployTarget);
    } else if (deployTarget !== 'default' && deployTarget !== configTarget) {
      throw new Error(
        `The configured deploy target in .deployconfig is "${configTarget}",\n` +
        `but we have determined your project should be deployed to "${deployTarget}".\n` +
        `Aborting deployment due to ambiguity.\n\n` + 
        `To fix this issue, run \`rm .deployconfig\` and \`instant deploy\` again`
      );
    } else {
      deployTarget = configTarget;
    }


    const env = ((params.vflags.env || [])[0] || '').trim();

    if (!env) {
      throw new Error(
        `Must specify environment with --env [environment].\n` +
        this.printRecommendedEnvironments(deployTarget)
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
     * Host-specific deploy environment restrictions
     */
    if (deployTarget === 'vercel') {
      if (env !== 'preview' && env !== 'production') {
        throw new Error(`Only valid environments for deployment target "vercel" are: preview, production`);
      }
    } else {
      throw new Error(
        `We can not determine your deployment target host.\n` +
        `You should run:\n\n` +
        `    instant db:migrate --env ${env}\n\n` +
        `and then use your manual deployment method.`
      );
    }

    const cfg = Instant.Config.read(env, 'main');

    console.log();
    console.log(colors.bold(`Migrating:`) + ` project via "${colors.bold.green(deployTarget)}" to environment "${colors.bold.green(env)}"...`);
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
      console.log(colors.bold.grey(`\t$ instant db:rollbackSync --env ${env}`));
      console.log(colors.bold.grey(`\t$ instant db:migrate --env ${env}`));
      throw new Error(`Can only deploy when remote state is "synced" or "filesystem_ahead"`);
    } else if (state.status === 'filesystem_ahead') {
      await Instant.Migrator.Dangerous.migrate();
    }

    Instant.Migrator.disableDangerous();
    Instant.disconnect();
    console.log();
    console.log(colors.bold(`Deploying:`) + ` Running "${colors.bold.green(deployTarget)}" deploy script for "${colors.bold.green(env)}"...`);

    // Only deploy environment-specific database info
    const dbPathname = Instant.Config.pathname();
    const dbFile = fs.readFileSync(Instant.Config.pathname());
    const dbObj = Instant.Config.load();
    Object.keys(dbObj).filter(key => key !== env).forEach(key => delete dbObj[key]);
    fs.writeFileSync(dbPathname, JSON.stringify(dbObj, null, 2));

    let deployError = null;

    try {
      /**
       * Host-specific deploy commands
       */
      if (deployTarget === 'vercel') {
        // Vercel does some tree-shaking / pruning on files
        // So we need to import the important files to include them
        const rootFile = `./api/index.mjs`;
        if (!fs.existsSync(rootFile)) {
          throw new Error(`Missing "./api/index.mjs", can not deploy to Vercel`);
        }
        const file = fs.readFileSync(rootFile);
        const fileString = file.toString();
        const imports = fs.readdirSync('.')
          .filter(filename => {
            return ![
              '.gitignore',
              'node_modules',
              'vercel.json',
              '.vercel',
              'package.json',
              'package-lock.json'
            ].includes(filename);
          })
          .map(filename => `path.join(process.cwd(), '${filename}');`);
        if (!fileString.includes('import path')) {
          imports.unshift(`import path from 'node:path';`);
        }
        imports.unshift(``);
        const tmpFile = Buffer.concat([
          file,
          Buffer.from(imports.join('\n'))
        ]);
        fs.writeFileSync(rootFile, tmpFile);
        console.log();
        if (env === 'production') {
          childProcess.spawnSync(`vercel --prod`, {stdio: 'inherit', shell: true});
        } else {
          childProcess.spawnSync(`vercel`, {stdio: 'inherit', shell: true});
        }
        // restore original file
        fs.writeFileSync(rootFile, file);
      }
    } catch (e) {
      deployError = e;
    }

    // Restore original database file
    fs.writeFileSync(dbPathname, dbFile);

    if (deployError) {
      throw deployError;
    }

    return void 0;

  }

}

module.exports = DeployCommand;
