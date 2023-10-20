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

  // Bootstrap database; empty test db, run all migrations and seed data
  const Instant = new InstantORM();
  Instant.enableLogs(2); // 0: off, 1: err, 2: sys, 3: info, 4: query
  await Instant.connect();
  Instant.Migrator.enableDangerous();
  const seed = Instant.Migrator.Dangerous.filesystem.readSeed();
  await Instant.Migrator.Dangerous.bootstrap(seed);
  Instant.Migrator.disableDangerous();
  Instant.disconnect();

  console.log();
  console.log(`# Starting test gateway on localhost:${PORT} ... `);
  console.log();

  // Start Gateway; {debug: true} will print logs
  const gateway = new Gateway({debug: false});
  gateway.load(process.cwd());       // load routes from filesystem
  gateway.listen(PORT);              // start server

  return { gateway };

});

// (4) Run tests; use first argument to specify a test
const args = process.argv.slice(3);
if (args[0]) {
  await testEngine.run(args[0]);
} else {
  await testEngine.runAll();
}

// (5) Finish; close Gateway
// Receive arguments from .setup()
testEngine.finish(async ({ gateway }) => {
  gateway.close();
});