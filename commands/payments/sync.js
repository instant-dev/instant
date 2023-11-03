const { Command } = require('cmnd');
const colors = require('colors/safe');

const fs = require('fs');
const path = require('path');

const loadInstant = require('../../helpers/load_instant.js');

class PaymentsSyncCommand extends Command {

  constructor() {
    super('payments', 'sync');
  }

  help () {
    return {
      description: 'Syncs Plans and Line Items to Stripe Products and Prices (bootstraps)',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to sync to`
      }
    };
  }

  async run (params) {

    const Instant = await loadInstant(params, true);

    if (!Instant.isFilesystemInitialized()) {
      throw new Error(
        `Instant.dev has not yet been initialized in "${Instant.filesystemRoot()}".\n\n` +
        `Please first initialize with:\n\n` +
        colors.grey.bold(`\t$ instant init`)
      );
    }

    const env = (params.vflags['env'] || [`development`])[0];

    if (!fs.existsSync(path.join(process.cwd(), 'node_modules', '@instant.dev/payments'))) {
      throw new Error(
        `Instant Payments not installed.\n` +
        `Install the payments kit with:\n` + 
        `  instant kit payments`
      );
    }

    const InstantPayments = require(path.join(process.cwd(), 'node_modules', '@instant.dev/payments'));

    const plansPathname = `./_instant/payments/plans.json`;
    const lineItemsPathname = `./_instant/payments/line_items.json`;
    const cachePathname = `./_instant/payments/cache/stripe_plans.json`;

    const envFile = env === 'development' ? `.env` : `.env.${env}`;
    if (!fs.existsSync(envFile)) {
      throw new Error(`Missing env file "${envFile}" for environment "${env}"`);
    } else if (fs.statSync(envFile).isDirectory()) {
      throw new Error(`Env file "${envFile}" for environment "${env}" is invalid: is a directory`);
    }

    const entries = Instant.readEnvObject(envFile);

    if (!entries['STRIPE_SECRET_KEY']) {
      throw new Error(`Missing "STRIPE_SECRET_KEY" in "${envFile}" for environment "${env}"`);
    } else if (!entries['STRIPE_PUBLISHABLE_KEY']) {
      throw new Error(`Missing "STRIPE_PUBLISHABLE_KEY" in "${envFile}" for environment "${env}"`);
    }

    console.log();
    console.log(`Syncing Stripe plans for environment "${env}" in "${cachePathname}" ...`);
    console.log();

    const {cache} = await InstantPayments.bootstrap(
      entries['STRIPE_SECRET_KEY'],
      plansPathname,
      lineItemsPathname
    );

    InstantPayments.writeCache(cachePathname, env, cache);

    console.log();
    console.log(colors.bold.green(`Success!`) + ` Synced Stripe plans for environment "${env}" in "${cachePathname}"!`);
    console.log();

  }

}

module.exports = PaymentsSyncCommand;
