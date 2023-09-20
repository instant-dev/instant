const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const loadInstant = require('../../helpers/load_instant.js');

class DbAddCommand extends Command {

  constructor() {
    super('db', 'add');
  }

  help () {
    return {
      description: 'Adds a new database to an environment',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to connect to`,
        db: 'Database alias to connect to (default: main)'
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(true);
    const environment = process.env.NODE_ENV || 'development';

    if (environment !== 'development') {
      throw new Error(`This command can only be used when process.env.NODE_ENV=development`);
    }

    const env = (params.vflags.env || [])[0];
    const db = (params.vflags.db || [])[0] || 'main';
    if (!env) {
      throw new Error(
        `Must specify environment with --env.\n` +
        `Recommended environment names are: staging, preview, production`
      );
    } else if (env === 'development') {
      throw new Error(
        `Can not change "development" database.\n` +
        `Try running \`instant init\` instead.`
      );
    }

    Instant.enableLogs(2);

    console.log();

    let connectResults = await inquirer.prompt([
      {
        name: 'inputType',
        type: 'list',
        message: 'How would you like to connect to this database?',
        choices: [
          {
            name: 'Connection string (e.g. postgres://[...])',
            value: 'connectionString'
          },
          {
            name: 'Enter manually: host / port / user / password / database',
            value: 'manual'
          }
        ],
        loop: false
      }
    ]);

    let envCfg;
    if (connectResults['inputType'] === 'connectionString') {
      const connectRE = /postgres\:\/\/(\w+)(?:\:(.*))?@([a-z0-9\-\.]+):(\d+)\/([a-z0-9\-\_]+)/gi;
      let results = await inquirer.prompt([
        {
          name: 'connectionString',
          type: 'input',
          message: 'connectionString',
          default: '',
          validate: str => {
            if (str.match(connectRE)) {
              return true;
            } else {
              return 'Must match: postgres://user:password@url.to.database:port/database';
            }
          }
        }
      ]);
      results.connectionString = results.connectionString.match(connectRE)[0];
      envCfg = results;
    } else {
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
      envCfg = results;
    }

    console.log();

    let requiresTunnel = await inquirer.prompt([
      {
        name: 'tunnel',
        type: 'list',
        message: `Is this Database inside of a VPC?\n` +
          `Does it require an SSH tunnel to connect to remotely?\n` +
          `If you aren't sure, the answer is probably no.`,
        default: false,
        choices: [
          {
            name: `No, I can access it on the open web ${colors.dim(`(e.g. Vercel Postgres, Railway, Supabase, Neon)`)}`,
            value: false
          },
          {
            name: `Yes, it is inside of a VPC ${colors.dim(`(e.g. AWS RDS)`)}`,
            value: true
          }
        ],
        loop: false
      }
    ]);

    if (requiresTunnel.tunnel) {
      console.log();
      let vpc = await inquirer.prompt([
        {
          name: 'in_vpc',
          type: 'list',
          message: `Will your project be deployed inside the VPC?\n` +
            `If so, we only need the tunnel to connect to the database remotely.`,
          default: true,
          choices: [
            {
              name: `Yes, I will be deploying it inside of the VPC ${colors.dim(`(e.g. AWS)`)}`,
              value: true
            },
            {
              name: `No, I am deploying with a host outside of the VPC ${colors.dim(`(e.g. Vercel Serverless, Railway)`)}`,
              value: false
            }
          ],
          loop: false
        }
      ]);
      envCfg.in_vpc = vpc.in_vpc;
      console.log();
      console.log(colors.bold.green(`Great!`));
      console.log(`So your database is in a VPC, and you ${colors.bold(envCfg.in_vpc ? 'will' : 'will not')} be deploying your project inside that VPC.`);
      console.log(`We just need the SSH connection details of a server inside the VPC to be able to connect remotely.`);
      console.log();
      let tunnel = await inquirer.prompt([
        {
          name: 'user',
          type: 'input',
          message: 'ssh user',
          default: 'ec2-user'
        },
        {
          name: 'host',
          type: 'input',
          message: 'ssh host',
          default: ''
        },
        {
          name: 'port',
          type: 'input',
          message: 'ssh port',
          default: '22'
        },
        {
          name: 'private_key',
          type: 'input',
          message: 'private key file',
          default: 'database.pem'
        }
      ]);
      envCfg.in_vpc = tunnel.in_vpc;
      delete tunnel.in_vpc;
      envCfg.tunnel = tunnel;
      console.log();
    }

    try {
      await Instant.connect(envCfg, null);
    } catch (e) {
      if (e.message.startsWith('connection is insecure')) {
        if (envCfg.connectionString) {
          envCfg.connectionString += '?ssl=true';
        } else {
          envCfg.ssl = true;
        }
        await Instant.connect(envCfg, null);
      } else if (e.message.endsWith(`Database "${envCfg.database}" does not exist.`)) {
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

    let migrationsEnabled = await Instant.Migrator.isEnabled();
    if (!migrationsEnabled) {
      Instant.Migrator.enableDangerous();
      await Instant.Migrator.Dangerous.prepare();
      Instant.Migrator.disableDangerous();
    }

    Instant.Config.write(env, db, envCfg);

    console.log();
    console.log(colors.bold.green(`Success: `) + `_instant/db.json["${env}"]["${db}"] added successfully!`);
    console.log();

    return void 0;

  }

}

module.exports = DbAddCommand;
