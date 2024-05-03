const colors = require('colors/safe');
const inquirer = require('inquirer');

const path = require('path');
const fs = require('fs');

const fileWriter = require('./file_writer.js');

const couldUseVPC = (cfg) => {
  let matchString = cfg.connectionString || cfg.host;
  if (matchString.match(/(upstash.io|localhost)/gi)) {
    return false;
  } else {
    return true;
  }
};

module.exports = async (Instant, env, db) => {

  const pkgPath = path.join(process.cwd(), '/node_modules/@instant.dev/kv');
  if (!fs.existsSync(pkgPath)) {
    throw new Error(
      `Must have Instant KV installed to add a KV Store.\n` +
      `Install with \`npm i @instant.dev/kv\``
    )
  }

  const InstantKV = require(pkgPath);
  const kv = new InstantKV({connectTimeout: 1000});

  let inputType = 'manual';
  if (env === 'development') {
    console.log();
    console.log(`Let's connect to your local ${colors.bold.blue('🎁 Redis')} instance.`);
    console.log(`Please enter your local Redis credentials:`);
    console.log();
  } else {
    console.log();
    console.log(`Let's add a remote ${colors.bold.blue('🎁 Redis')} instance.`);
    console.log();
    console.log(`Here are some popular Redis hosts:`);
    console.log(`     AWS ElastiCache => ${colors.bold.underline.blue('https://us-west-2.console.aws.amazon.com/elasticache/home?#/redis')}`);
    console.log(`     Vercel          => ${colors.bold.underline.blue('https://vercel.com/dashboard/stores?type=redis')}`);
    console.log(`     Upstash         => ${colors.bold.underline.blue('https://console.upstash.com/')}`);
    console.log();
    let connectResults = await inquirer.prompt([
      {
        name: 'inputType',
        type: 'list',
        message: 'How would you like to connect to this database?',
        choices: [
          {
            name: 'Connection string (e.g. redis://[...])',
            value: 'connectionString'
          },
          {
            name: 'Enter manually: host / port / user / password',
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
    const connectRE = /redis(s)?\:\/\/(?:(\w+)(?:\:(.*))?@)?([a-z0-9\-\.]+):(\d+)(?:\/([a-z0-9\-\_]+))?/gi;
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
            return 'Must match: redis://user:password@url.to.database:port/database';
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
        default: '6379'
      },
      {
        name: 'user',
        type: 'input',
        message: 'user',
        default: 'default'
      },
      {
        name: 'password',
        type: 'input',
        message: 'password',
        default: ''
      }
    ];
    let results = await inquirer.prompt(inputs);
    envCfg = results;
    if (env === 'development') {
      testCfg = {...envCfg};
      testCfg.database = '1';
    }
  }

  console.log();

  if (env !== 'development' && couldUseVPC(envCfg)) {
    let requiresTunnel = await inquirer.prompt([
      {
        name: 'tunnel',
        type: 'list',
        message: `Is this Redis instance inside of a VPC?\n` +
          `Does it require an SSH tunnel to connect to remotely?\n` +
          `If you aren't sure, the answer is probably no.`,
        default: false,
        choices: [
          {
            name: `No, I can access it on the open web ${colors.dim(`(e.g. Vercel KV, Upstash)`)}`,
            value: false
          },
          {
            name: `Yes, it is inside of a VPC ${colors.dim(`(e.g. AWS ElastiCache)`)}`,
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
              name: `No, I am deploying with a host outside of the VPC ${colors.dim(`(e.g. Vercel, Railway)`)}`,
              value: false
            }
          ],
          loop: false
        }
      ]);
      envCfg.in_vpc = vpc.in_vpc;
      console.log();
      console.log(colors.bold.green(`Great!`));
      console.log(`So your Redis instance is in a VPC, and you ${colors.bold(envCfg.in_vpc ? 'will' : 'will not')} be deploying your project inside that VPC.`);
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

  for (const [tmpEnv, tmpCfg] of [[env, envCfg], ['test', testCfg]]) {

    if (tmpCfg) {

      let envCfg = {...tmpCfg};
      if (envCfg.connectionString) {
        if (!envCfg.tunnel) {
          envCfg.connectionString = envCfg.connectionString.replaceAll('redis:', 'rediss:');
        }
        // otherwise do nothing, but don't set .ssl
      } else {
        envCfg.ssl = true;
      }

      try {
        await kv.connect(envCfg);
      } catch (e) {
        if (e.message.includes('Connection timeout') && !envCfg.tunnel) {
          console.log(colors.bold(`KVConfig:`) + ` Notice: Connection timeout, trying without SSL ...`);
          if (envCfg.connectionString) {
            envCfg.connectionString = envCfg.connectionString.replaceAll('rediss:', 'redis:');
          } else {
            envCfg.ssl = false;
          }
          await kv.connect(envCfg);
        } else {
          throw e;
        }
      }

      const envFile = tmpEnv === `development` ? `.env` : `.env.${tmpEnv}`;

      Instant.writeEnv(envFile, 'NODE_ENV', tmpEnv);
      for (const key in envCfg) {
        if (['connectionString', 'host', 'user', 'port', 'password', 'database'].includes(key)) {
          const envVar = `${db}_kv_${key}`.toUpperCase();
          Instant.writeEnv(envFile, envVar, envCfg[key]);
          envCfg[key] = `{{ ${envVar} }}`;
        } else if (key === 'tunnel') {
          const tunnel = envCfg[key];
          for (const tkey in tunnel) {
            if (['host', 'user', 'port'].includes(tkey)) {
              const envVar = `${db}_kv_tunnel_${tkey}`.toUpperCase();
              Instant.writeEnv(envFile, envVar, tunnel[tkey]);
              tunnel[tkey] = `{{ ${envVar} }}`;
            }
          }
        }
      }
      kv.Config.write(tmpEnv, db, envCfg);

      // ignore the private key file if it was added
      if (envCfg?.tunnel?.private_key) {
        fileWriter.writeLine('.gitignore', envCfg.tunnel.private_key);
      }

      await kv.disconnect();

    }

  }

  console.log();
  console.log(colors.bold.green(`Success: `) + `Key-value store for "${env}" added successfully to _instant/db.json["${env}"]["${db}"]!`);
  if (testCfg) {
    console.log(colors.bold.green(`Success: `) + `Key-value store for "test" added successfully to _instant/db.json["test"]["${db}"]!`);
  }
  console.log();

  const envFile = env === 'development' ? `.env` : `.env.${env}`;
  envCfg = kv.Config.read(env, db, Instant.readEnvObject(envFile));

};
