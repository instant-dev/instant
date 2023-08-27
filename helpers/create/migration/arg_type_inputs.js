const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('inflect');

const argTypeInputs = {
  'column[]': async (db, schema, table) => {
    let columns = [];
    let prefixColumns = [{name: 'id', type: 'serial'}];
    let suffixColumns = [
      {name: 'created_at', type: 'datetime'},
      {name: 'updated_at', type: 'datetime'}
    ];
    let getColumns = () => {
      return [].concat(prefixColumns, columns, suffixColumns);
    };
    console.log(`Now we need to add some columns!`);
    console.log(`Note that by default the following columns are included:`);
    complete = false
    while (!complete) {
      console.log();
      console.log(colors.bold(table));
      getColumns().forEach(column => {
        console.log(`  ${colors.bold(column.name)} ${colors.dim(`(${column.type})`)}${column.properties ? ' ' + JSON.stringify(column.properties) : ''}`);
      });
      console.log();
      let results = await inquirer.prompt([
        {
          name: 'continue',
          type: 'confirm',
          message: 'Add another column?'
        }
      ]);
      if (!results['continue']) {
        complete = true;
      } else {
        let results = await inquirer.prompt([
          {
            name: 'name',
            type: 'input',
            message: 'name',
            validate: str => !!(str && !getColumns().find(c => c.name === str))
          },
          {
            name: 'type',
            type: 'list',
            message: 'type',
            choices: db.listTypes().map(type => {
              return {
                name: (
                  type.source === 'alias'
                    ? type.name
                    : colors.dim(`${type.name} (${type.source})`)
                ),
                value: type.name
              }
            }),
            loop: false
          }
        ]);
        let column = results;
        let typeProperties = db.adapter.getTypeProperties(column.type);
        let properties = await inquirer.prompt([
          {
            name: 'nullable',
            type: 'confirm',
            message: `nullable ${colors.dim(`(default: true)`)}`,
            default: true
          },
          {
            name: 'unique',
            type: 'confirm',
            message: `unique ${colors.dim(`(default: false)`)}`,
            default: false
          }
        ]);
        Object.keys(properties).forEach(key => {
          if (properties[key] === typeProperties[key]) {
            delete properties[key];
          }
        });
        if (Object.keys(properties).length) {
          column.properties = properties;
        }
        columns.push(column);
      }
    }
    return columns;
  },
  'columnProperties': async () => {
    console.log('TODO: columnProperties');
  },
  'columnType': async () => {
    console.log('TODO: columnType');
  },
  'indexType': async () => {
    console.log('TODO: indexType');
  },
  'foreignKeyBehavior': async () => {
    console.log('TODO: foreignKeyBehavior');
  }
};

module.exports = argTypeInputs;
