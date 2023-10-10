const { Command } = require('cmnd');
const colors = require('colors/safe');
const commandExists = require('command-exists').sync;

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const loadInstant = require('../../helpers/load_instant.js');
const checkMigrationState = require('../../helpers/check_migration_state.js');

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

  async run (params) {

    const Instant = await loadInstant(params, true);

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

    const env = ((params.vflags.env || [])[0] || '').trim();

    if (!env) {
      throw new Error(
        `Must specify environment with --env [environment].`
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

    let configTarget = Instant.readEnvKey(`.deployconfig.${env}`, 'TARGET');
    if (!configTarget) {
      throw new Error(
        `Deployment configuration for "${env}" not found in ".deployconfig.${env}",\n` +
        `Run \`instant deploy:config\` to configure your deployment settings`
      );
    }

    /**
     * Host-specific deploy environment restrictions
     */
    if (configTarget === 'vercel') {
      if (env !== 'preview' && env !== 'production') {
        throw new Error(`Only valid environments for deployment target "vercel" are: preview, production`);
      }
    }

    const cfg = Instant.Config.read(env, 'main');

    console.log();
    console.log(colors.bold(`Migrating:`) + ` project via "${colors.bold.green(configTarget)}" to environment "${colors.bold.green(env)}"...`);
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
    console.log(colors.bold(`Deploying:`) + ` Running deploy script for "${colors.bold.green(env)}" to "${colors.bold.green(configTarget)}" ...`);
    console.log();

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
      if (configTarget === 'aws') {
        if (!fs.existsSync(path.join(process.cwd(), 'node_modules', '@instant.dev/deploy'))) {
          console.log(colors.bold('Installing: ') + `Instant DeploymentManager (@instant.dev/deploy) ...`);
          console.log();
          childProcess.execSync(`npm i @instant.dev/deploy@latest --save-dev`, {stdio: 'inherit'});
        }
        const { DeploymentManager } = require(path.join(process.cwd(), 'node_modules', '@instant.dev/deploy'));
        const InstantAPI = require(path.join(process.cwd(), 'node_modules', '@instant.dev/api'));
        const EncryptionTools = InstantAPI.EncryptionTools;
        const dm = new DeploymentManager(`.deployconfig.${env}`);
        const et = new EncryptionTools();
        const encryptResult = et.encryptEnvFileFromPackage(
          dm.readPackageFiles(process.cwd()),
          `.env.${env}`,
          `.env`,
          /^\.env\..*$/
        );
        let deployResult = await dm.deployToElasticBeanstalk(
          encryptResult.files,
          env,
          encryptResult.env,
          (...messages) => {
            console.log(colors.bold(`DeploymentManager:`), ...messages);
          }
        );
        console.log();
        console.log(`✅ Success! Deployed environment "${colors.bold.green(env)}" successfully to "${colors.bold.green(configTarget)}"!`);
        console.log();
        console.log(`Dashboard URL   => ${colors.bold.underline.blue(deployResult.dashboard_url)}`);
        console.log(`Application URL => ${colors.bold.underline.blue(deployResult.app_url)}`);
        console.log();
      } else if (configTarget === 'vercel') {
        if (!commandExists('vercel')) {
          console.log(colors.bold('Installing: ') + `Vercel command line tools ...`);
          console.log();
          childProcess.execSync(`npm i -g vercel@latest`, {stdio: 'inherit'});
        }
        // Vercel does some tree-shaking / pruning on files
        // So we need to import the important files to include them
        const rootFile = `./api/index.mjs`;
        if (!fs.existsSync(rootFile)) {
          throw new Error(`Missing "./api/index.mjs", can not deploy to Vercel`);
        }
        const file = fs.readFileSync(rootFile);
        const fileString = file.toString();
        const imports = fs.readdirSync('.')
          .filter(filename => !filename.startsWith('.deployconfig'))
          .filter(filename => !filename.startsWith(`.env`) || filename === `.env.${env}`)
          .filter(filename => {
            return ![
              '.gitignore',
              '.vercel',
              'node_modules',
              'package.json',
              'package-lock.json',
              'vercel.json'
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
        try {
          console.log();
          if (env === 'production') {
            childProcess.spawnSync(`vercel --prod`, {stdio: 'inherit', shell: true});
          } else {
            childProcess.spawnSync(`vercel`, {stdio: 'inherit', shell: true});
          }
          // restore original file
          fs.writeFileSync(rootFile, file);
        } catch (e) {
          // restore original file
          fs.writeFileSync(rootFile, file);
          throw e;
        }
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
