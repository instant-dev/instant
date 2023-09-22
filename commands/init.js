const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const commandExists = require('command-exists');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const loadInstant = require('../helpers/load_instant.js');
const fileWriter = require('../helpers/file_writer.js');

class InitCommand extends Command {

  constructor() {
    super('init');
  }

  help () {
    return {
      description: 'Initialize a new Instant.dev project with a ["development"]["main"] database',
      args: [],
      flags: {},
      vflags: {
        force: 'overwrites existing migrations and config'
      }
    };
  }

  async run (params) {

    const environment = process.env.NODE_ENV || 'development';
    if (environment !== 'development') {
      throw new Error(`This command can only be used when process.env.NODE_ENV=development`);
    }

    let Instant = await loadInstant();
    if (!Instant) {
      console.log();
      console.log(colors.bold.black(`Installing:`) + ` @instant.dev/orm (latest)...`);
      if ('link' in params.vflags) {
        childProcess.execSync(`npm link @instant.dev/orm`, {stdio: 'inherit'});
      } else {
        childProcess.execSync(`npm i @instant.dev/orm --save`, {stdio: 'inherit'});
      }
      Instant = await loadInstant(true, false);
    }

    Instant.enableLogs(2);

    const force = ('force' in params.vflags);

    if (!force && Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has already been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `You can force a new initialization with:\n\n` +
        colors.grey.bold(`\t$ instant init --force\n\n`) +
        `which will reset your migrations but preserve your database.\n\n` +
        `If you simply want to reset your data, run:\n\n` +
        colors.grey.bold(`\t$ instant db:bootstrap\n\n`) +
        `which will empty your database, re-run all migrations, and seed your data.`
      );
    }

    console.log();
    console.log(`Welcome to ${colors.bold('instant.dev')} 🧙!`);
    console.log();

    const pkgExists = fs.existsSync('package.json');
    const pkgString = pkgExists ? fs.readFileSync('package.json').toString() : '{}';
    let pkg;
    try {
      pkg = JSON.parse(pkgString);
    } catch (e) {
      console.error(e);
      throw new Error(`Invalid JSON in "package.json"`);
    }
    let framework = fileWriter.determineFramework();

    if (!pkg.name) {
      console.log(`✨ It looks like you're starting from scratch.`);
      console.log();
      const frameworkExists = {
        'autocode': await commandExists('lib'),
        'vercel': await commandExists('vercel')
      };
      let name = process.cwd().split(path.sep).pop();
      let result = await inquirer.prompt([
        {
          name: 'name',
          type: 'input',
          message: 'Enter a project name',
          validate: s => {
            if (s.match(/[^a-z0-9\-]/i)) {
              return `can only contain alphanumeric or - characters`;
            } else {
              return true;
            }
          },
          default: name.replace(/[^a-z0-9\-]+/gi, '-')
        },
        {
          name: 'framework',
          type: 'list',
          message: `Select a framework / host to start with`,
          choices: [
            {
              name: `Autocode${colors.dim(frameworkExists['autocode'] ? `` : ` (will install)`)}`,
              value: `autocode`
            },
            {
              name: `Vercel${colors.dim(frameworkExists['vercel'] ? `` : ` (will install)`)}`,
              value: `vercel`
            }
          ],
          loop: false
        }
      ]);
      framework = result.framework;
      name = result.name;
      console.log();
      console.log(`Great! We'll start a new ${colors.bold('instant.dev')} project with "${colors.bold.green(framework)}".`);
      console.log();
      if (framework === 'autocode') {
        if (!frameworkExists['autocode']) {
          childProcess.execSync(`npm i -g lib.cli@latest`, {stdio: 'inherit'});
        }
        throw new Error(`Autocode WIP`);
      } else if (framework === 'vercel') {
        if (!frameworkExists['vercel']) {
          childProcess.execSync(`npm i -g vercel@latest`, {stdio: 'inherit'});
        }
        const result = childProcess.spawnSync(`vercel link --yes`, {stdio: 'inherit', shell: true});
        if (result.signal === 'SIGINT') {
          process.exit(2)
        }
        fileWriter.writeJSON('package.json', 'name', name);
        return;
      } else {
        throw new Error(`Framework "${framework}" not yet supported`);
      }
      framework = fileWriter.determineFramework();
    } else {
      console.log(`👀 It looks like you're adding ${colors.bold('instant.dev')} to an existing${framework !== 'default' ? ` "${colors.bold.green(framework)}"` : ``} project.`);
      console.log();
      let result = await inquirer.prompt([
        {
          name: 'verify',
          type: 'confirm',
          message: `Continue adding instant.dev to your${framework !== 'default' ? ` "${colors.bold.green(framework)}"` : ``} project?`,
        }
      ]);
      if (!result.verify) {
        throw new Error(`Initialization aborted`);
      }
    }

    console.log();
    console.log(`Next, we need to connect to your local Postgres instance.`);
    console.log(`If you haven't set one up yet, please visit [URL].`);
    console.log();

    console.log('Please enter your local Postgres credentials:');

    let results = await inquirer.prompt([
      {
        name: 'host',
        type: 'input',
        message: 'host',
        default: 'localhost'
      },
      {
        name: 'port',
        type: 'input',
        message: 'port',
        default: '5432'
      },
      {
        name: 'user',
        type: 'input',
        message: 'user',
        default: 'postgres'
      },
      {
        name: 'password',
        type: 'input',
        message: 'password',
        default: ''
      },
      {
        name: 'database',
        type: 'input',
        message: 'database',
        default: 'postgres'
      }
    ]);
    let envCfg = results;

    console.log();

    try {
      await Instant.connect(envCfg, null);
    } catch (e) {
      if (e.message.endsWith(`Database "${envCfg.database}" does not exist.`)) {
        let database = envCfg.database;
        console.log();
        console.log(colors.bold.yellow('Warning: ') + `Database "${database}" does not yet exist.`);
        console.log(`However, you can create it now if you'd like.`);
        console.log();
        let results = await inquirer.prompt([
          {
            name: 'create',
            type: 'confirm',
            message: `Create database "${database}"?`
          }
        ]);
        if (!results['create']) {
          throw new Error(`Aborted. Database "${database}" does not exist.`);
        } else {
          console.log();
          delete envCfg.database;
          Instant.disconnect();
          await Instant.connect(envCfg, null);
          await Instant.database().create(database);
          Instant.disconnect();
          envCfg.database = database;
          await Instant.connect(envCfg, null);
        }
      } else {
        throw e;
      }
    }

    Instant.Config.write('development', 'main', envCfg);
    Instant.Migrator.enableDangerous();
    Instant.Migrator.Dangerous.reset();
    await Instant.Migrator.Dangerous.prepare();
    await Instant.Migrator.Dangerous.initialize();
    Instant.Migrator.disableDangerous();
    Instant.disconnect();

    // Write framework-specific directives
    if (framework === 'autocode') {
      fileWriter.writeJSON('env.json', 'local', {}, true);
      fileWriter.writeLine('.gitignore', 'env.json');
    }

    console.log();
    console.log(colors.bold.green(`Success: `) + `Instant.dev initialized successfully!`);
    console.log();
    console.log(`You can create a new migration with:`);
    console.log();
    console.log(
      colors.grey.bold(
        `\t$ instant new migration`
      )
    );
    console.log();
    console.log(`Please visit [URL] for more information about using Instant.dev.`);
    console.log(colors.green.bold(`Happy building! :)`));
    console.log();

    return void 0;

  }

}

module.exports = InitCommand;
