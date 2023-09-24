const { Command } = require('cmnd');
const colors = require('colors/safe');
const fs = require('fs');
const childProcess = require('child_process');


const loadInstant = require('../helpers/load_instant.js');
const fileWriter = require('../helpers/file_writer.js');

class ServeCommand extends Command {

  constructor() {
    super('serve');
  }

  help () {
    const environment = process.env.NODE_ENV || 'development';
    return {
      description: 'Starts a development server: uses framework commands or your package.json["scripts"]["start"]',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
    const environment = process.env.NODE_ENV || 'development';
    const framework = fileWriter.determineFramework();

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    if (framework !== 'default') {
      console.log();
      console.log(`Running development server for framework "${colors.bold.green(framework)}" ...`);
      console.log();
      if (framework === 'autocode') {
        childProcess.spawnSync(`lib http`, {stdio: 'inherit', shell: true});
      } else if (framework === 'vercel') {
        childProcess.spawnSync(`vercel dev`, {stdio: 'inherit', shell: true});
      } else {
        throw new Error(`Could not find development server command for "${framework}"`);
      }
    } else {
      const pkgExists = fs.existsSync('package.json');
      if (pkgExists) {
        let pkg;
        try {
          pkg = JSON.parse(fs.readFileSync('package.json').toString());
        } catch (e) {
          throw new Error(`Could not read "package.json"`);
        }
        if (pkg?.scripts?.start) {
          childProcess.spawnSync(pkg.scripts.start, {stdio: 'inherit', shell: true});
        } else {
          throw new Error(`Could not find "package.json"["scripts"]["start"]`);
        }
      } else {
        throw new Error(`No "package.json" in this directory`);
      }
    }

    return void 0;

  }

}

module.exports = ServeCommand;
