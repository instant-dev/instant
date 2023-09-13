const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const Instant = require('@instant.dev/orm')();

class NewCommand extends Command {

  constructor() {
    super('init');
  }

  help () {
    return {
      description: 'Initialize a new Instant.dev project with a ["development"]["main"] database',
      args: [],
      flags: {},
      vflags: {
        kit: 'specify a kit to initialize with',
        force: 'overwrites existing migrations and config'
      }
    };
  }

  async run (params) {

    const environment = process.env.NODE_ENV || 'development';
    if (environment !== 'development') {
      throw new Error(`This command can only be used when process.env.NODE_ENV=development`);
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

    let kit = null;

    if (params.vflags.kit) {
      kit = {
        name: params.vflags.kit,
        migrations: {},
        models: {},
        dependencies: {}
      };
      const kitListRoot = path.join(__dirname, '..', 'kits');
      const kits = fs.readdirSync(kitListRoot);
      if (kits.indexOf(kit.name) === -1) {
        throw new Error(`Kit "${kit.name}" not found.\nValid kits are: ${kits.join(', ')}`);
      }
      const kitRoot = path.join(kitListRoot, kit.name);
      const migrationsRoot = path.join(kitRoot, 'migrations');
      const modelsRoot = path.join(kitRoot, 'models');
      const depsPath = path.join(kitRoot, 'dependencies.json');
      if (fs.existsSync(migrationsRoot)) {
        try {
          kit.migrations = fs.readdirSync(migrationsRoot)
            .reduce((m, filename) => {
              m[filename] = fs.readFileSync(path.join(migrationsRoot, filename));
              m[filename] = JSON.parse(m[filename].toString());
            }, {});
        } catch (e) {
          throw new Error(`Invalid migrations in "${modelsRoot}":\n${e.message}`);
        }
      }
      if (fs.existsSync(modelsRoot)) {
        try {
          kit.models = fs.readdirSync(modelsRoot)
            .reduce((m, filename) => {
              m[filename] = fs.readFileSync(path.join(modelsRoot, filename));
              m[filename] = m[filename].toString();
            }, {});
        } catch (e) {
          throw new Error(`Invalid models in "${modelsRoot}":\n${e.message}`);
        }
      }
      if (fs.existsSync(depsPath)) {
        let deps = fs.readFileSync(depsPath);
        try {
          kit.dependencies = JSON.parse(deps.toString());
        } catch (e) {
          throw new Error(`Invalid dependencies in "${depsPath}":\n${e.message}`);
        }
      }
    }

    console.log();
    console.log(`Welcome to ${colors.green.bold('Instant.dev')}!`);
    console.log();
    console.log(`To get started, we need to connect to your local Postgres instance.`);
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

    // Write boilerplate from kit and install dependencies
    const packagePath = path.join(process.cwd(), 'package.json');
    const pkg = {
      name: 'new-instant-project',
      version: '0.0.0',
      dependencies: {}
    };
    if (fs.existsSync(packagePath)) {
      let readPackage = fs.readFileSync(packagePath);
      try {
        readPackage = JSON.parse(readPackage);
      } catch (e) {
        throw new Error(`Could not read "package.json":\n${e.message}`);
      }
      Object.keys(readPackage).forEach(key => {
        pkg[key] = readPackage[key];
      });
    }

    if (kit) {
      Object.keys(kit.migrations).forEach(key => {
        let migration = kit.migrations[key];
        Instant.Migrator.Dangerous.filesystem.write(migration);
      });
      Object.keys(kit.models).forEach(key => {
        let model = kit.models[key];
        Instant.Generator.write(model);
      });
      Object.keys(kit.dependencies).forEach(key => {
        pkg.dependencies[key] = kit.dependencies[key];
      });
    }
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

    if (Object.keys(pkg.dependencies).length > 0) {
      childProcess.execSync(`npm i`, {stdio: 'inherit'});
    }
    // childProcess.execSync(`npm i @instant.dev/orm`, {stdio: 'inherit'});
    childProcess.execSync(`npm link @instant.dev/orm`, {stdio: 'inherit'});

    Instant.Migrator.disableDangerous();
    Instant.disconnect();

    console.log();
    console.log(colors.bold.green(`Instant.dev initialized successfully!`));
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

module.exports = NewCommand;
