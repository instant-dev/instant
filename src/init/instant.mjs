import InstantAPI from '@instant.dev/api';
import InstantORM from '@instant.dev/orm';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
const Daemon = InstantAPI.Daemon;
const Gateway = InstantAPI.Daemon.Gateway;

const ENVIRONMENT = process.env.NODE_ENV || 'development';
dotenv.config({path: `.env.${ENVIRONMENT}`});
const PORT = process.env.PORT || 8000;

if (cluster.isPrimary) {

  const daemon = new Daemon(
    ENVIRONMENT !== 'development'
      ? os.cpus().length
      : 1
  );
  daemon.start(PORT);

} else {

  const gateway = new Gateway({debug: ENVIRONMENT !== 'production'});
  await InstantORM.connectToPool();
  gateway.load(process.cwd());
  gateway.listen(PORT);

}