const colors = require('colors/safe');
const inquirer = require('inquirer');
const inflect = require('i')();

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
          }
        ]);
        let column = results;
        column.type = await argTypeInputs['columnType'](db, schema, table, column);
        column.properties = await argTypeInputs['columnProperties'](db, schema, table, column);
        if (!column.properties) {
          delete column.properties;
        }
        columns.push(column);
      }
    }
    return columns;
  },
  'columnType': async (db, schema, table, column) => {
    let results = await inquirer.prompt([
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
    // set column type...
    column.type = results['type'];
    return results['type'];
  },
  'columnProperties': async (db, schema, table, column) => {
    let typeProperties = db.adapter.getTypeProperties(column.type);
    let properties = await inquirer.prompt([
      {
        name: 'nullable',
        type: 'list',
        message: `nullable`,
        choices: [
          {
            name: `true ${colors.dim('(default)')}`,
            value: true
          },
          {
            name: `false`,
            value: false
          }
        ],
        default: true
      },
      {
        name: 'unique',
        type: 'list',
        message: `unique`,
        choices: [
          {
            name: `true`,
            value: true
          },
          {
            name: `false ${colors.dim('(default)')}`,
            value: false
          }
        ],
        default: false
      }
    ]);
    Object.keys(properties).forEach(key => {
      if (properties[key] === typeProperties[key]) {
        delete properties[key];
      }
    });
    if (Object.keys(properties).length) {
      return properties;
    } else {
      return null;
    }
  },
  'indexType': async (db, schema, table, column) => {
    let results = await inquirer.prompt([
      {
        name: 'indexType',
        type: 'list',
        message: 'indexType',
        choices: db.adapter.indexTypes,
        default: db.adapter.indexTypes[0]
      }
    ]);
    let indexType = results['indexType'];
    return indexType;
  },
  'foreignKeyBehavior': async (db, schema, table, column) => {
    let behaviorDefaults = db.adapter.foreignKeyBehaviorDefaults;
    let behavior = await inquirer.prompt(
      Object.keys(behaviorDefaults).map(key => {
        return {
          name: key,
          type: 'list',
          message: key,
          choices: [
            {
              name: `true${behaviorDefaults[key] === true ? colors.dim(' (default)') : ''}`,
              value: true
            },
            {
              name: `false${behaviorDefaults[key] === false ? colors.dim(' (default)') : ''}`,
              value: false
            }
          ],
          default: behaviorDefaults[key]
        }
      })
    );
    Object.keys(behavior).forEach(key => {
      if (behavior[key] === behaviorDefaults[key]) {
        delete behavior[key];
      }
    });
    if (Object.keys(behavior).length) {
      return behavior;
    } else {
      return null;
    }
  }
};

module.exports = argTypeInputs;
