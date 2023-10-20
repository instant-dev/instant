import InstantAPI from '@instant.dev/api';
import InstantORM from '@instant.dev/orm';
import dotenv from 'dotenv';

const Gateway = InstantAPI.Gateway;
const TestEngine = InstantAPI.TestEngine;
const PORT = 7357; // Leetspeak for "TEST"; can be anything

// (1) Load environment variables; make sure NODE_ENV is "test"
dotenv.config({path: `.env.test`});
process.env.NODE_ENV = `test`;

// (2) Initialize; load tests
const testEngine = new TestEngine(PORT);
await testEngine.initialize('./test/tests');

// (3) Setup; create objects and infrastructure for tests
// Arguments returned here will be sent to .finish()
testEngine.setup(async () => {

  console.log('# Bootstrapping test database ... ');
  console.log();

  // Bootstrap test database; clear db, run migrations, apply seed
  const InstantSetup = new InstantORM();
  InstantSetup.enableLogs(2); // 0: off, 1: err, 2: sys, 3: info, 4: query
  await InstantSetup.connect();
  InstantSetup.Migrator.enableDangerous();
  const seed = InstantSetup.Migrator.Dangerous.filesystem.readSeed();
  await InstantSetup.Migrator.Dangerous.bootstrap(seed);
  InstantSetup.Migrator.disableDangerous();
  InstantSetup.disconnect();

  console.log();
  console.log(`# Starting test gateway on localhost:${PORT} ... `);
  console.log();

  // Start Gateway; {debug: true} will print logs
  const gateway = new Gateway({debug: false});
  gateway.load(process.cwd());       // load routes from filesystem
  gateway.listen(PORT);              // start server

  // Start InstantORM; connect to a pool
  const Instant = await InstantORM.connectToPool();

  return { gateway, Instant };

});

// (4) Run tests; use first argument to specify a test
const args = process.argv.slice(3);
if (args[0]) {
  await testEngine.run(args[0]);
} else {
  await testEngine.runAll();
}

// (5) Finish; close Gateway and disconnect from database
// Receive arguments from .setup()
testEngine.finish(async ({ gateway, Instant }) => {
  gateway.close();
  Instant.disconnect();
});