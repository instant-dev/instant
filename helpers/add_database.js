const colors = require('colors/safe');
const inquirer = require('inquirer');

const fileWriter = require('./file_writer.js');

const couldUseVPC = (cfg) => {
  let matchString = cfg.connectionString || cfg.host;
  if (matchString.match(/(vercel-storage\.com|supabase\.co|neon\.tech)/gi)) {
    return false;
  } else {
    return true;
  }
};

module.exports = async (Instant, env, db, projectName = null) => {

  let suggestedName = (projectName || '').replace(/\W+/gi, '_');

  let inputType = 'manual';
  if (env === 'development') {
    console.log();
    console.log(`Let's connect to your local ${colors.bold.blue('🐘 Postgres')} instance.`);
    console.log(`Please enter your local Postgres credentials:`);
    console.log();
  } else {
    console.log();
    console.log(`Let's add a remote ${colors.bold.blue('🐘 Postgres')} instance.`);
    console.log();
    console.log(`Here are some popular Postgres hosts:`);
    console.log(`     AWS RDS => ${colors.bold.underline.blue('https://console.aws.amazon.com/rds/home?#databases:')}`);
    console.log(`     Vercel  => ${colors.bold.underline.blue('https://vercel.com/dashboard/stores')}`);
    console.log(`     Neon    => ${colors.bold.underline.blue('https://console.neon.tech/app/projects')}`);
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
    inputType = connectResults['inputType'];
  }

  let envCfg = null;
  let testCfg = null;
  if (inputType === 'connectionString') {
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
    let inputs = [
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
        default: suggestedName ? `${suggestedName}_development` : `postgres`
      }
    ];
    let results = await inquirer.prompt(inputs);
    envCfg = results;
    if (env === 'development') {
      let testResults = await inquirer.prompt({
        name: 'test_database',
        type: 'input',
        message: 'test database',
        default: results.database.endsWith('_development')
          ? results.database.replace(/_development$/gi, '_test')
          : `${results.database}_test`
      });
      testCfg = {...envCfg};
      testCfg.database = testResults.test_database;
    }
  }

  console.log();

  if (env !== 'development' && couldUseVPC(envCfg)) {
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
            `If so, we only need the tunnel to connect to the database remotely.\n` +
            `The answer to this is usually "Yes".`,
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
          default: `database.${env}.pem`
        }
      ]);
      envCfg.tunnel = tunnel;
      console.log();
    }
  }

  for (const [tmpEnv, {...tmpCfg}] of [[env, envCfg], ['test', testCfg]]) {

    if (tmpCfg) {

      try {
        await Instant.connect(tmpCfg, null);
      } catch (e) {
        if (e.message.startsWith('connection is insecure')) {
          console.log(colors.bold(`DatabaseConfig:`) + ` Notice: Connection requires SSL, enabling ...`);
          if (tmpCfg.connectionString) {
            tmpCfg.connectionString += '?ssl=true';
          } else {
            tmpCfg.ssl = true;
          }
          await Instant.connect(tmpCfg, null);
        } else if (e.message.endsWith(`Database "${tmpCfg.database}" does not exist.`)) {
          let database = tmpCfg.database;
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
            delete tmpCfg.database;
            Instant.disconnect();
            await Instant.connect(tmpCfg, null);
            await Instant.database().create(database);
            Instant.disconnect();
            tmpCfg.database = database;
            await Instant.connect(tmpCfg, null);
          }
        } else {
          throw e;
        }
      }

      if (tmpEnv !== 'development') {
        let migrationsEnabled = await Instant.Migrator.isEnabled();
        if (!migrationsEnabled) {
          Instant.Migrator.enableDangerous();
          await Instant.Migrator.Dangerous.prepare();
          Instant.Migrator.disableDangerous();
        }
      }

      const envFile = tmpEnv === `development` ? `.env` : `.env.${tmpEnv}`;

      Instant.writeEnv(envFile, 'NODE_ENV', tmpEnv);
      for (const key in tmpCfg) {
        if (['connectionString', 'host', 'user', 'port', 'password', 'database'].includes(key)) {
          const envVar = `${db}_database_${key}`.toUpperCase();
          Instant.writeEnv(envFile, envVar, tmpCfg[key]);
          tmpCfg[key] = `{{ ${envVar} }}`;
        } else if (key === 'tunnel') {
          const tunnel = tmpCfg[key];
          for (const tkey in tunnel) {
            if (['host', 'user', 'port'].includes(tkey)) {
              const envVar = `${db}_database_tunnel_${tkey}`.toUpperCase();
              Instant.writeEnv(envFile, envVar, tunnel[tkey]);
              tunnel[tkey] = `{{ ${envVar} }}`;
            }
          }
        }
      }
      Instant.Config.write(tmpEnv, db, tmpCfg);

      // ignore the private key file if it was added
      if (tmpCfg?.tunnel?.private_key) {
        fileWriter.writeLine('.gitignore', tmpCfg.tunnel.private_key);
      }

      Instant.disconnect();

    }

  }

  console.log();
  console.log(colors.bold.green(`Success: `) + `Database for "${env}" added successfully to _instant/db.json["${env}"]["${db}"]!`);
  if (testCfg) {
    console.log(colors.bold.green(`Success: `) + `Database for "test" added successfully to _instant/db.json["test"]["${db}"]!`);
  }
  console.log();

  await Instant.connect(envCfg, null);

};
