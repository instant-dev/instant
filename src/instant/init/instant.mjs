import InstantAPI from '@instant.dev/api';
import InstantORM from '@instant.dev/orm';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';

const ENVIRONMENT = process.env.NODE_ENV || 'development';
dotenv.config({path: `.env.${ENVIRONMENT}`});

const PORT = process.env.PORT || 8000;

if (cluster.isPrimary) {

  const daemon = new InstantAPI.Daemon(
    ENVIRONMENT !== 'development'
      ? os.cpus().length
      : 1
  );
  daemon.start(PORT);

} else {

  await InstantORM.connectToPool();
  const gateway = new InstantAPI.Daemon.Gateway({
    debug: ENVIRONMENT !== 'production'
  });
  gateway.load(process.cwd());
  gateway.listen(PORT);

}