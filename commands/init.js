const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const commandExists = require('command-exists').sync;

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const loadInstant = require('../helpers/load_instant.js');
const addDatabase = require('../helpers/add_database.js');
const fileWriter = require('../helpers/file_writer.js');
const drawBox = require('../helpers/draw_box.js');

const writeInitFiles = (pathname, pkg) => {
  const files = fileWriter.readRecursive(pathname);
  for (const filename in files) {
    if (filename === '/package.json') {
      let json;
      try {
        json = JSON.parse(files[filename].toString());
      } catch (e) {
        throw new Error(`Invalid "package.json" in init files`);
      }
      const scripts = json.scripts || {};
      const deps = json.dependencies || {};
      for (const key in scripts) {
        fileWriter.writeJSON('package.json', `scripts.${key}`, scripts[key]);
      }
      const depList = [];
      for (const name in deps) {
        depList.push(`${name}@${deps[name]}`);
      }
      if (depList.length) {
        console.log();
        console.log(colors.bold.black(`Installing:`) + ` "${depList.join('", "')}" ...`);
        const installString = `npm i ${depList.join(' ')} --save`;
        childProcess.execSync(installString, {stdio: 'inherit'});
        console.log();
      }
    } else {
      fileWriter.writeFile(filename, files[filename], false);
    }
  }
};

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

    const force = ('force' in params.vflags);
    const instantRoot = './_instant';

    if (!force && fs.existsSync(instantRoot)) {
      throw new Error(
        `Instant.dev has already been initialized in "${instantRoot}".\n` +
        `Are you sure you meant to do this? Here are some other options:\n\n` +
        `(1) Create database if it does not exist, reset migrations, but preserve database data:\n` +
        colors.grey.bold(`     $ instant db:prepare\n\n`) +
        `(2) Create database if it does not exist, empty database, run migrations, and seed data:\n` +
        colors.grey.bold(`     $ instant db:bootstrap\n\n`) +
        `(3) Force a new initialization (reset migrations, but preserve database data):\n` +
        colors.grey.bold(`     $ instant init --force`)
      );
    }

    console.log();
    console.log(
      drawBox.center(
        `blue`,
        `Welcome to ${colors.bold('🧙 instant.dev')}!`,
      )
    );

    const pkgExists = fs.existsSync('package.json');
    let createFromSrc = false;

    console.log();
    console.log(`🪄 You are about to initialize ${colors.bold('instant.dev')} in the current directory:`)
    console.log(`   📂 ${colors.dim(process.cwd())}`);
    console.log();
    if (!pkgExists) {
      console.log(`✨ We've detected you're starting from scratch`);
      console.log();
      createFromSrc = true;
      let verifyResult = await inquirer.prompt([
        {
          name: 'verify',
          type: 'confirm',
          message: `Continue with initialization?`,
          default: true
        }
      ]);
      if (!verifyResult.verify) {
        throw new Error(`Initialization aborted`);
      }
    } else {
      console.log(`📦 We've detected that you're adding to an existing project`);
      console.log(`❓ Would you like to install Instant API or just Instant ORM and Migrations?`);
      console.log();
      let installResult = await inquirer.prompt([
        {
          name: 'install',
          type: 'list',
          message: `What would you like to install?`,
          default: true,
          choices: [
            {
              name: `Instant API and Instant ORM ${colors.green.dim('(recommended)')}`,
              value: true
            },
            {
              name: `Instant ORM and Migrations only`,
              value: false
            }
          ]
        }
      ]);
      createFromSrc = installResult.install;
    }

    let Instant = await loadInstant(params);
    if (!Instant) {
      console.log();
      console.log(colors.bold.black(`Installing:`) + ` "@instant.dev/orm@latest" ...`);
      if ('link' in params.vflags) {
        childProcess.execSync(`npm link @instant.dev/orm`, {stdio: 'inherit'});
      } else {
        childProcess.execSync(`npm i @instant.dev/orm --save`, {stdio: 'inherit'});
      }
      if (!Instant) {
        Instant = await loadInstant(null, true);
      }
    }

    Instant.enableLogs(2);

    let ormPackage;
    try {
      ormPackage = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'node_modules', '@instant.dev/orm', 'package.json')
        ).toString()
      );
    } catch (e) {
      throw new Error(`Could not load @instant.dev/orm package`);
    }
    let ormName = ormPackage.name || '@instant.dev/orm';
    let ormVersion = ormPackage.version || 'latest';

    const pkgString = pkgExists
      ? fs.readFileSync('package.json').toString()
      : JSON.stringify({dependencies: {[ormName]: `^${ormVersion}`}});
    let pkg;
    try {
      pkg = JSON.parse(pkgString);
    } catch (e) {
      console.error(e);
      throw new Error(`Invalid JSON in "package.json"`);
    }

    let name = pkg.name || process.cwd().split(path.sep).pop();

    if (createFromSrc) {
      console.log();
      console.log(`✨ Since you're starting a new installation, let's name your project.`);
      console.log();
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
        }
      ]);
      name = result.name;
    }
    const filesRoot = path.join(__dirname, '..', 'src', 'init');
    if (!fs.existsSync(filesRoot)) {
      throw new Error(`No init template files found`);
    }
    writeInitFiles(filesRoot);
    // Write package.json
    fileWriter.writeJSON('package.json', 'name', name);
    fileWriter.writeJSON('package.json', 'private', true);

    if (createFromSrc) {
      console.log();
      console.log(`Instant API project "${colors.bold.blue(name)}" initialized successfully!`);
    } else {
      console.log();
      console.log(`Instant ORM added to project "${colors.bold.blue(name)}" successfully!`);
    }

    await addDatabase(Instant, 'development', 'main');

    Instant.Migrator.enableDangerous();
    Instant.Migrator.Dangerous.createSeedIfNotExists();
    Instant.Migrator.Dangerous.filesystem.clear();
    await Instant.Migrator.Dangerous.prepare();
    await Instant.Migrator.Dangerous.initialize();
    Instant.Migrator.disableDangerous();
    Instant.disconnect();

    console.log();
    console.log(
      drawBox.left(
        `green`,
        ``,
        colors.bold.green(`Success:`) + ` ${colors.bold(`instant.dev`)} initialized!`,
        `Here are some helpful commands to get started:`,
        ``,
        `(1) Create a new model by generating a model file and migration:`,
        colors.grey.bold(`     $ instant g:model\n`),
        `(2) Create a set of endpoints for a model (create, read, update, destroy, list):`,
        colors.grey.bold(`     $ instant g:endpoint --for [model]\n`),
        `(3) Create a relationship between models (one-to-one or one-to-many):`,
        colors.grey.bold(`     $ instant g:relationship\n`),
        `(4) Create a custom migration:`,
        colors.grey.bold(`     $ instant g:migration\n`),
        `(5) Run your dev server:`,
        colors.grey.bold(`     $ instant serve`),
        ``,
        `For more information about ${colors.bold(`instant.dev`)}:`,
        `     Home    => ${colors.bold.underline.blue('https://instant.dev')}`,
        `     GitHub  => ${colors.bold.underline.blue('https://github.com/instant-dev')}`,
        `     Discord => ${colors.bold.underline.blue('https://discord.gg/puVYgA7ZMh')}`,
        `     X       => ${colors.bold.underline.blue('https://x.com/instantdevs')}`,
        ``,
        colors.green.bold(`Happy building! :)`),
        ``
      )
    );
    console.log();

    return void 0;

  }

}

module.exports = InitCommand;
