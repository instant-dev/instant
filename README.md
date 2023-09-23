# instant.dev ![Build Status](https://app.travis-ci.com/instant-dev/orm.svg?branch=main)

## Rails-inspired JavaScript ORM and Migrations for Postgres

[**instant.dev**](https://instant.dev) provides a fast, reliable, and heavily
battle-tested Object-Relational Mapper and Migration Management system for
Postgres 13+ built in JavaScript. For those familiar with Ruby on Rails, you can
think of instant.dev like ActiveRecord for the Node.js, Deno and Bun ecosystems.
We’ve been using it since 2016 in production at [Autocode](https://autocode.com)
where it has managed over 1 billion records in a 4TB AWS Aurora Postgres
instance.

You can add instant.dev to any existing JavaScript project or use it to
scaffold a new project from scratch.

We built it for development teams that;

1. Are using Postgres (AWS RDS, Railway, Vercel Postgres, Neon, Supabase)
   to manage their data and are working with one or more JavaScript backends.

2. Need to execute quickly on new product features without in-depth SQL
   authoring and optimization knowledge.

3. Need table structure, index and foreign key guarantees between multiple local
   dev environments, staging and prod.

## Features

1. **CRUD operations**: Create, Read, Update and Destroy records easily.

2. **Query composition**: Build complex SELECT and UPDATE queries with many
   layers of nested joins and conditional statements.

3. **Transactions**: Ensure data consistency within logical transaction blocks
   that can be rolled back to prevent writing orphaned data.

4. **Input validation**: Synchronously validate object fields to ensure the
   right data is being stored.

5. **Relationship verification**: Asynchronously validate relationships between
   one or more fields and external resources before saving.

6. **Calculated fields**: Automatically populate object fields based on existing
   data.

7. **Lifecycle callbacks**: Execute custom logic beforeSave(), afterSave(),
   beforeDestroy() and afterDestroy() to perform necessary build and teardown
   steps inside of transactions.

8. **Migrations**: Manage local database state via the filesystem to make
   branched git development a breeze.

9. **Seeding**: Provide custom JSON files so that all developers can share the
   same test data across development, testing and staging environments.

10. **Code generation**: Automatically generate models, migrations and endpoints
    for your project.

## Similarity to Ruby on Rails and ActiveRecord

instant.dev borrows heavily from the Ruby on Rails ecosystem, specifically
ActiveRecord. The main differences are;

- instant.dev can be dropped in to any existing JavaScript project, you do not
  need to start a project from scratch.

- Due to the above, instant.dev is less prescriptive of convention over
  configuration: we're more tolerant of naming choices. For example,
  `Instant.Model('User')` and `Instant.Model('users')` are both valid ways of
  accessing the model associated with the `users` table.

- Relationships between models, notably one-to-one and one-to-many, are
  determined by database structure (foreign keys, uniqueness).

- Migrations are JSON files, not executable JavaScript. In theory the `instant`
  command line tools can be used to manage Postgres migrations for any code base.

- Postgres is currently the only Database adapter supported, but the
  [ORM](https://github.com/instant-dev/orm) has been designed with flexibility
  in mind: an enterprising contributor could add other engines!

An example of a `User` model looks like this:

```javascript
// _instant/models/user.js

const { InstantORM } = require('@instant.dev/orm');
const bcrypt = require('bcryptjs');

class User extends InstantORM.Core.Model {

  static tableName = 'users';

  /**
   * Before the user is saved, we need to hash the password if it's been set
   * e.g. via User.signup();
   */
  async beforeSave (txn) {
    if (!this.hasErrors()) {
      // Hash password
      if (this.hasChanged('password')) {
        let hash;
        try {
          hash = bcrypt.hashSync(this.get('password'), 10);
        } catch (err) {
          throw new Error('Could not encrypt password');
        }
        this.__safeSet__('password', hash);
      }
      // All emails lowercase
      if (this.hasChanged('email')) {
        this.set('email', this.get('email').toLowerCase());
      }
    }
  }

  /**
   * Verifies a user's password from an unencrypted input
   * @param {string} unencrypted The plaintext password
   */
  async verifyPassword (unencrypted) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(unencrypted, this.get('password'), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

}

// Validates email and password before .save()
User.validates('email', 'must be valid', v => v && (v + '').match(/.+@.+\.\w+/i));
User.validates('password', 'must be at least 5 characters in length', v => v && v.length >= 5);

// hides a field: prevent output via .toJSON()
User.hides('password');

module.exports = User;
```

To create a new user:

```javascript
const Instant = require('@instant.dev/orm');
await Instant.connect(); // loads from: _instant/db.json
const User = Instant.Model('User');

// Password will automatically encrypt via bcryptjs due to User#beforeSave
// This will save the user in the database
const user = await User.create({
  email: 'keith@instant.dev',
  password: 'hunter2'
});

let hashedPassword = user.get('password'); // password now encrypted
```

To find all users that have an `@instant.dev` email account:

```javascript
const Instant = require('@instant.dev/orm');
await Instant.connect(); // loads from: _instant/db.json
const User = Instant.Model('User');

let users = User.query()
  .where({email__iendswith: `@instant.dev`})
  .select();
```

For more documentation on the ORM and Model methods, please visit the
[@instant.dev/orm](https://github.com/instant-dev/orm) repository.

## Table of Contents

Stay tuned!

# Getting Started

instant.dev consists of two main components:

1. The [instant](https://github.com/instant-dev/cli) command line utility
   (npm: [instant.dev](https://npmjs.com/package/instant.dev)),
   a tool for scaffolding projects and managing migrations.

2. The Instant ORM (npm: [@instant.dev/orm](https://npmjs.com/package/@instant.dev/orm)),
   an Object-Relational Mapper for easy CRUD operations, query composition and
   transactions.

**To use instant.dev you must have Postgres installed locally.** If you're
running macOS, the easiest way to manage a local Postgres installation is with
[Postgres.app](https://postgresapp.com). You can also view Postgres installation
options at [postgresql.org/download](https://www.postgresql.org/download).

## Installation

To get started with Instant.dev, you'll first install the CLI:

```shell
$ npm i instant.dev -g
```

Now, visit your main project directory for your Node.js, Deno or Bun project
and run `instant init`.

```shell
$ cd ~/projects/my-awesome-project
$ instant init
```

That's it! The command line tool will walk you through the process of
initializing your instant.dev project. It will;

- Automatically detect whether this is a new project or an existing one
- Scaffold a new [Vercel](https://vercel.com) or [Autocode](https://autocode.com)
  project, if necessary
- Ask for your local database credentials
- Initialize necessary files in the `_instant/` directory of your project
- Create an initial migration

You now have an initial migration saved to your filesystem that will
enable any other developers who work on this branch to keep up to date with
schema changes to your database.

## Using Migrations

Migrations are instruction sets that tell us how to alter the structure of a
relational database. Typically they provide two directions of execution, "up"
(migration) and "down" (rollback). They allow us ensure data consistency between
our database and multiple development branches.

### Why use Migrations?

Say, for example, you're working on your own local development branch and you
add a table called `receipts`. Your co-worker Nick is working on a different
branch and has added a table called `orders`. You're both writing logic that
depends on your migrations, but your database won't have `orders` in it and
Nick's won't have `receipts`. When you finally go to merge Nick's code in to
your branch, none of his code will work! In fact your whole app might crash
because your database state is missing the `orders` table.

Migrations make this problem disappear. Once you merge in Nick's code, you'll
get his migration in your filesystem. If his migration was made after yours,
when you try to run your code or take any action, you'll get a notification
that your local filesystem has migrations your database is missing
(`local_ahead`). If his migration has an earlier timestamp, you'll be warned
of an `unsynced` state. Both can be easily rectified by the `instant` command
line utility, which will allow you to rollback migrations to the last
synchronized state, and then re-run migrations as expected.

### How do Migrations work?

Migrations with instant.dev work like this;

- The database keeps a record of all migrations it has applied in the
  `_instant_migrations` table.

- Your local filesystem, usually checked into version control, keeps a record of
  all migrations in the `./instant/migrations/` directory.

- When the [Instant ORM](https://github.com/instant-dev/orm) starts up, either
  in code or when you use the CLI, the database's record of migrations and the
  filesystems are compared.

- If the migrations don't match, you'll get an error and be asked to run
  commands to synchronize the database and local branch state.

- Every migration you generate will automatically populate a reverse direction
  so they can be rolled back without issue. eg `createTable` will have a
  `dropTable` call added for the rollback.

### Creating your first table

To create your first table, simply use the command line:

```shell
$ instant new migration
> Which command would you like to add?
> o createTable
>   dropTable
>   addColumn
>   alterColumn
>   dropColumn
> [...]
```

We'll pick `createTable`:

```shell
$ instant new migration
> Which command would you like to add?: createTable
> Table name:
```

I recommend adding a table `users` with the column `username`, type `string`.
Note that you can have multiple commands in a single migration. Once you
complete the CLI instructions, you should get a file that looks something like
`./instant/migrations/xxxxxxxxxxxxxx__create_users.json`. If you open it up
you'll see:

```json
{
  "some_migration": "cool"
}
```

This migration file contains everything your database needs to know to both
run and rollback the migration.

To apply the migration, simply run;

```shell
$ instant migrate
```

And voila, you now have a `users` table!

## Using the Instant ORM

Now that you have a `users` table, you can import the Instant ORM anywhere
in your JavaScript project.

```javascript
const Instant = require('@instant.dev/orm')();

// defaults to using instant/config.json[process.env.NODE_ENV || 'local']
await Instant.connect();

// Get the user model.
// Instant automatically maps CamelCase singular to tableized snake_case plural
const User = Instant.Model('User');

// Create a user
let user = await User.create({username: 'Billy'});

// log user JSON
// {id: 1, username: 'Billy', created_at: '...', updated_at: '...'}
console.log(user.toJSON());

let user2 = await User.create({username: 'Sharon'});
let users = await User.query().select(); // queries all users

// [{username: 'Billy', ...}, {username: 'Sharon', ...}]
console.log(users.toJSON());
```

Full documentation for the ORM can be found in the
[@instant.dev/orm](https://github.com/instant-dev/orm) repository.

# Feature breakdown

## CRUD operations

## Query composition

## Transactions

## Input validation

## Relationship verification

## Calculated fields

## Lifecycle callbacks

## Migrations

## Seeding

# Sample projects

Stay tuned!

# Roadmap

Stay tuned!

# Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

# Acknowledgements

Thanks!

-- old below --

# Installing kits

## auth

To install the "auth" kit, which contains a **User** and **AccessToken**
model and provides authentication into a web API via the `Authorization` header:

```shell
$ instant kit auth
```

### Signing up a user

```shell
$ curl localhost:3000/api/users --data \
  "email=keith@instant.dev&password=mypass&repeat_password=mypass"
```

Should give you:

```json
{
  "id": 1,
  "email": "keith@instant.dev",
  "created_at": "2023-09-18T22:46:44.866Z",
  "updated_at": "2023-09-18T22:46:44.940Z"
}
```

### Logging in a user

```shell
$ curl localhost:3000/api/auth --data \
  "username=keith@instant.dev&password=mypass&grant_type=password"
```

Should give you;

```json
{
  "key": "secret_development_K7neQjsdnM2etQ1naPrTFqRMgJWwppvzrbbWefipib4Sqex6hmPrrqvYdczQ7vbp",
  "ip_address": "::ffff:127.0.0.1",
  "user_agent": "curl/7.79.1",
  "expires_at": "2023-10-18T22:53:36.967Z",
  "is_valid": true,
  "created_at": "2023-09-18T22:53:36.967Z",
  "updated_at": "2023-09-18T22:53:36.967Z",
}
```

### Seeing your own user data

```shell
$ curl localhost:3000/api/users/me \
  -H "Authorization: Bearer secret_development_K7neQjsdnM2etQ1naPrTFqRMgJWwppvzrbbWefipib4Sqex6hmPrrqvYdczQ7vbp"
```

Should give you;

```json
{
  "id": 1,
  "email": "keith@instant.dev",
  "created_at": "2023-09-18T22:46:44.866Z",
  "updated_at": "2023-09-18T22:46:44.940Z"
}
```

### Seeing a list of all users

```shell
$ curl localhost:3000/api/users \
  -H "Authorization: Bearer secret_development_K7neQjsdnM2etQ1naPrTFqRMgJWwppvzrbbWefipib4Sqex6hmPrrqvYdczQ7vbp"
```

Should give you;

```json
[
  {
    "id": 1,
    "email": "keith@instant.dev",
    "created_at": "2023-09-18T22:46:44.866Z",
    "updated_at": "2023-09-18T22:46:44.940Z"
  }
]
```
