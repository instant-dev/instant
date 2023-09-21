const colors = require('colors/safe');

module.exports = async (Instant, checkEnv = 'development', localEnv = 'development') => {

  let hasMigrationsEnabled = await Instant.Migrator.isEnabled();
  if (!hasMigrationsEnabled) {
    throw new Error(
      `Your local database does not have migrations enabled.\n` +
      `This is usually caused by cloning a project you haven't set up a database for yet.\n` +
      `Run \`instant db:prepare\` to set up your database or \`instant db:bootstrap\` to bootstrap your database.`
    );
  }

  let state = await Instant.Migrator.Dangerous.getMigrationState();
  let diffs = await Instant.Migrator.Dangerous.getTextDiffs();

  console.log(`Your current migration state is: ${colors.bold.blue(state.status)}`);
  console.log();
  console.log(diffs);
  console.log();

  if (state.status === 'synced') {
    console.log(`Everything looks up-to-date on migrations!`);
    return true;
  } else if (state.status === 'filesystem_ahead') {
    console.log(`To apply outstanding migrations:`);
    console.log();
    console.log(colors.bold.grey(`\t$ instant db:migrate${checkEnv !== localEnv ? ` --env ${checkEnv}` : ``}`));
    return false;
  } else {
    console.log(`To rollback the database to last synced point and apply outstanding migrations:`);
    console.log();
    console.log(colors.bold.grey(`\t$ instant db:rollbackSync${checkEnv !== localEnv ? ` --env ${checkEnv}` : ``}`));
    console.log(colors.bold.grey(`\t$ instant db:migrate${checkEnv !== localEnv ? ` --env ${checkEnv}` : ``}`));
    return false;
  }

};
