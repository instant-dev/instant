const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const loadInstant = require('../helpers/load_instant.js');

class SqlCommand extends Command {

  constructor() {
    super('task');
  }

  help () {
    const environment = process.env.NODE_ENV || 'development';
    return {
      description: 'Runs a task in /tasks/ directory',
      args: ['task'],
      flags: {},
      vflags: {
        env: `Environment to connect to (default: ${environment})`
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);
    const environment = process.env.NODE_ENV || 'development';

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    let env = (params.vflags.env || [])[0] || environment;
    let taskName = (params.args[0] || '').trim();

    if (!taskName) {

      const filenames = fs.readdirSync(path.join(process.cwd(), 'tasks')).filter(filename => filename.endsWith('.js') || filename.endsWith('.mjs'));
      if (filenames.length === 0) {
        throw new Error(`No tasks found in "tasks/" directory.`);
      }
      const taskNames = filenames.map(filename => {
        return filename.split('.').slice(0, -1).join('.');
      });

      console.log();
      console.log(`⚡️ Choose a task to run in environment "${colors.bold.green(env)}" ...`);
      console.log();
      const taskResult = await inquirer.prompt([
        {
          name: 'taskName',
          type: 'list',
          message: `Which task would you like to run?`,
          default: true,
          choices: [].concat(
            taskNames.map(taskName => ({ name: taskName, value: taskName })),
            [ { name: `❌ cancel`, value: null } ]
          )
        }
      ]);
      taskName = taskResult.taskName;

      if (!taskName) {
        return void 0;
      }

    }

    let taskPath = path.join(process.cwd(), 'tasks', taskName + '.js');
    if (!fs.existsSync(taskPath)) {
      taskPath = path.join(process.cwd(), 'tasks', taskName + '.mjs');
      if (!fs.existsSync(taskPath)) {
        throw new Error(`Task "${taskName}" not found in "tasks/" directory. Must be a .js or .mjs file.`);
      }
    }

    let db = 'main';
    const envFile = env === 'development' ? `.env` : `.env.${env}`;
    Instant.useEnvObject(envFile);
    let cfg = Instant.Config.read(env, db);

    console.log();
    console.log(`Connecting to environment "${colors.bold.green(env)}" ...`);
    console.log();

    Instant.enableLogs(2);
    await Instant.connect(cfg);

    console.log();
    console.log(`Running task "${colors.bold.blue(taskName)}" ...`);
    console.log();

    const task = await import(taskPath);
    if (typeof task.run !== 'function') {
      throw new Error(`Task "${taskName}" must have a "run" function`);
    }

    // Run task...
    await task.run(Instant);

    return void 0;

  }

}

module.exports = SqlCommand;
