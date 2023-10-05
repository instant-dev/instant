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
    let framework = fileWriter.determineFramework();

    console.log();
    console.log(`🪄 You are about to initialize ${colors.bold('instant.dev')} in the current directory:`)
    console.log(`   📂 ${colors.dim(process.cwd())}`);
    console.log();
    if (!pkgExists) {
      console.log(`✨ We've detected you're starting from scratch`);
    } else if (framework === 'default') {
      console.log(`❓ We couldn't auto-detect a framework, but ${colors.bold('instant.dev')} will still work!`);
      console.log(`   Some generation features (endpoints, kits) may be unavailable`);
    } else {
      console.log(`📦 We've detected you're using the supported framework "${colors.bold.green(framework)}"`);
    }
    console.log();
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

    let Instant = await loadInstant(params);
    if (!Instant) {
      console.log();
      console.log(colors.bold.black(`Installing:`) + ` @instant.dev/orm (latest)...`);
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

    if (!pkg.name) {
      console.log();
      console.log(`✨ Since you're starting from scratch, let's name your project and choose a framework.`);
      console.log();
      const frameworkExists = {
        'autocode': commandExists('lib'),
        'vercel': commandExists('vercel')
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
              name: `Vercel (Serverless Functions)${colors.dim(frameworkExists['vercel'] ? `` : ` (will install)`)}`,
              value: `vercel`
            }
          ],
          loop: false
        }
      ]);
      framework = result.framework;
      name = result.name;
      let username = '';
      console.log();
      console.log(`Great! We'll start a new ${colors.bold('instant.dev')} project with "${colors.bold.green(framework)}".`);
      console.log();
      if (framework === 'autocode') {
        if (!frameworkExists['autocode']) {
          childProcess.execSync(`npm i -g lib.cli@latest`, {stdio: 'inherit'});
        }
        const getUser = async () => {
          return new Promise((resolve, reject) => {
            let p = childProcess.spawn(`lib`, [`user`]);
            let buffers = [];
            p.stdout.on('data', data => buffers.push(data));
            p.on('close', async (code) => {
              const stdout = Buffer.concat(buffers).toString();
              resolve({code, stdout});
            });
          });
        };
        let userResult = await getUser();
        if (userResult.code !== 0) {
          console.log(`🔒 Log in to Autocode to continue`);
          console.log(`👉 You can sign up at: ${colors.bold.blue(`https://autocode.com/signup/`)}`);
          console.log();
          const result = childProcess.spawnSync(`lib login`, {stdio: 'inherit', shell: true});
          if (result.signal === 'SIGINT') {
            console.log();
            process.exit(2)
          }
          userResult = await getUser();
        }
        if (userResult.code !== 0) {
          throw new Error(`Unable to log in to Autocode`);
        }
        username = userResult.stdout.replace(/^[\s\S]*?\s+username:\s+(.*?)\s+[\s\S]*?$/gi, '$1') || '';
      } else if (framework === 'vercel') {
        if (!frameworkExists['vercel']) {
          childProcess.execSync(`npm i -g vercel@latest`, {stdio: 'inherit'});
        }
        const result = childProcess.spawnSync(`vercel link`, {stdio: 'inherit', shell: true});
        if (!fs.existsSync('.vercel')) {
          throw new Error(`Framework initialization aborted`);
        }
        console.log();
        if (result.signal === 'SIGINT') {
          process.exit(2)
        }
      } else if (framework === 'instant') {
        // do nothing
      } else {
        throw new Error(`Framework "${framework}" not yet supported`);
      }
      const srcRoot = path.join(__dirname, '..', 'src');
      const frameworkFilesRoot = path.join(srcRoot, framework, 'init');
      if (!fs.existsSync(frameworkFilesRoot)) {
        throw new Error(`No init template files found for "${framework}"`);
      }
      const files = fileWriter.readRecursive(frameworkFilesRoot);
      for (const filename in files) {
        fileWriter.writeFile(filename, files[filename], false);
      }
      // Write package.json
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      fileWriter.writeJSON('package.json', 'name', name);
      fileWriter.writeJSON('package.json', 'private', true);
      // Write the project name to stdlib.json if we're in Autocode
      if (framework === 'autocode') {
        fileWriter.writeJSON('stdlib.json', 'name', `${username}/${name}`);
      }
      console.log();
      console.log(`Framework "${colors.bold.green(framework)}" project created successfully!`);
    }

    await addDatabase(Instant, 'development', 'main');

    Instant.Migrator.enableDangerous();
    Instant.Migrator.Dangerous.createSeedIfNotExists();
    Instant.Migrator.Dangerous.filesystem.clear();
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
    console.log(
      drawBox.left(
        `green`,
        ``,
        colors.bold.green(`Success:`) + ` ${colors.bold(`instant.dev`)} initialized with framework "${colors.bold.green(framework)}"!`,
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
        `(5) Run your dev server (runs framework-specific command):`,
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
