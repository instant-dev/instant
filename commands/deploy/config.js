const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const commandExists = require('command-exists').sync;

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const loadInstant = require('../../helpers/load_instant.js');
const fileWriter = require('../../helpers/file_writer.js');

class DeployConfigCommand extends Command {

  constructor() {
    super('deploy', 'config');
  }

  help () {
    return {
      description: 'Configures deployment settings for a project by writing to .deployconfig',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
    const suggestedDeployTarget = fileWriter.determineDeployTarget();

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    if (!fs.existsSync('instant.mjs')) {
      throw new Error(
        `Can not configure deployment for Instant API: Could not find "instant.mjs" in your root directory.\n` +
        `\n` +
        `If you're just using Instant ORM and want to deploy, you should run:\n\n` + 
        `    instant db:migrate --env [env]\n\n` +
        `and then use your manual deployment method.`
      );
    }

    Instant.enableLogs(2);

    console.log();
    console.log(`✨ Let us help you get deployments set up.`);
    console.log(`❓ Please pick a deployment target`);
    console.log();
    let deployQuery = await inquirer.prompt([
      {
        name: 'target',
        type: 'list',
        message: `Where would you like to host your project?`,
        choices: [
          {
            name: `AWS Elastic Beanstalk`,
            value: `aws`
          },
          {
            name: `Vercel`,
            value: `vercel`
          }
        ]
      }
    ]);
    let configTarget = deployQuery.target;

    // First, necessary install step ...
    if (configTarget === 'aws') {
      if (!fs.existsSync(path.join(process.cwd(), 'node_modules', '@instant.dev/deploy'))) {
        console.log();
        console.log(colors.bold('Installing: ') + `Instant DeploymentManager (@instant.dev/deploy) ...`);
        console.log();
        childProcess.execSync(`npm i @instant.dev/deploy@latest --save-dev`, {stdio: 'inherit'});
      }
    } else if (configTarget === 'vercel') {
      if (!commandExists('vercel')) {
        console.log();
        console.log(colors.bold('Installing: ') + `Vercel command line tools ...`);
        console.log();
        childProcess.execSync(`npm i -g vercel@latest`, {stdio: 'inherit'});
      }
      if (suggestedDeployTarget !== 'vercel') {
        const result = childProcess.spawnSync(`vercel link`, {stdio: 'inherit', shell: true});
        if (!fs.existsSync('.vercel')) {
          throw new Error(`Framework initialization aborted`);
        }
        if (result.signal === 'SIGINT') {
          process.exit(2)
        }
      }
    } else {
      throw new Error(`Unsupported deploy target: "${configTarget}`);
    }

    console.log();
    console.log(`📦 Which environment would you like to configure deployments for?`);
    console.log();
    const dbCfg = Instant.Config.load();
    const envList = [].concat(
      Object.keys(dbCfg)
        .filter(name => ['development', 'staging', 'production'].indexOf(name) === -1),
      'staging',
      'production'
    );
    let envQuery = await inquirer.prompt([
      {
        name: 'environment',
        type: 'list',
        message: `Which environment are you configuring?`,
        choices: (
          configTarget === 'vercel'
            ? [
                {
                  name: `preview`,
                  value: `preview`
                },
                {
                  name: `production`,
                  value: `production`
                }
              ]
            : [].concat(
                envList.map(name => ({name: name, value: name})),
                {
                  name: `(custom) ${colors.dim('enter your own name')}`,
                  value: `custom`
                }
              )
        )
      }
    ]);

    let env = envQuery.environment;

    if (env === 'custom') {
      let customEnvQuery = await inquirer.prompt([
        {
          name: 'environment',
          type: 'list',
          message: `Enter a custom environment name`,
          validate: s => {
            let valid = s.match(/[a-z][a-z0-9]{2,}/i);
            return !!valid || 'must start with a letter, be at least three characters long, and be only alphanumeric'
          }
        }
      ]);
      env = customEnvQuery.environment;
    }

    let target = Instant.readEnvKey(`.deployconfig.${env}`, 'TARGET');
    if (target) {
      throw new Error(
        `Deployment configuration for "${env}" already exists in ".deployconfig.${env}" as "${target}",\n` +
        `If you would like to overwrite it, run \`rm .deployconfig.${env}\` and \`instant deploy:config\` again`
      );
    }

    const srcRoot = path.join(__dirname, '..', 'src');
    const deployFilesRoot = path.join(srcRoot, 'deploy', configTarget);
    if (fs.existsSync(deployFilesRoot)) {
      const files = fileWriter.readRecursive(deployFilesRoot);
      for (const filename in files) {
        fileWriter.writeFile(filename, files[filename], false);
      }
    }

    if (configTarget === 'aws') {
      console.log();
      console.log(`🛠 To set up deployments to AWS, we need to configure some settings ...`);
      console.log();
      const { DeploymentManager } = require(path.join(process.cwd(), 'node_modules', '@instant.dev/deploy'));
      const dm = new DeploymentManager();
      const keys = dm.requiredKeys['AWS'];
      const keyResult = await inquirer.prompt(keys.map(keyData => {
        if (keyData.choices) {
          return {
            name: keyData.name,
            message: keyData.description,
            type: 'list',
            choices: keyData.choices.map(key => ({name: key, value: key}))
          };
        } else {
          return {
            name: keyData.name,
            message: keyData.description,
            type: 'input',
            validate: s => !!s || 'can not be empty'
          };
        }
      }));
      console.log();
      Instant.writeEnv(`.env.${env}`, 'NODE_ENV', env);
      Instant.writeEnv(`.deployconfig.${env}`, 'TARGET', configTarget);
      for (const keyData of keys) {
        Instant.writeEnv(`.deployconfig.${env}`, keyData.name, keyResult[keyData.name]);
      }
    } else {
      console.log();
      Instant.writeEnv(`.env.${env}`, 'NODE_ENV', env);
      Instant.writeEnv(`.deployconfig.${env}`, 'TARGET', configTarget);
    }

    console.log();
    console.log(`✅ Success! Environment "${colors.bold.green(env)}" is configured to deploy to "${colors.bold.green(configTarget)}"!`);
    console.log();

    return void 0;
  
  }

}

module.exports = DeployConfigCommand;
