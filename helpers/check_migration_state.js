const colors = require('colors/safe');

module.exports = async (Instant) => {

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
    console.log(colors.bold.grey(`\t$ instant db:migrate`));
    return false;
  } else {
    console.log(`To rollback the database to last synced point and apply outstanding migrations:`);
    console.log();
    console.log(colors.bold.grey(`\t$ instant db:rollbackSync`));
    console.log(colors.bold.grey(`\t$ instant db:migrate`));
    return false;
  }

};
