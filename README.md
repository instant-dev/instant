<div align="center">
  <h1>instant.dev <img alt="npm" src="https://img.shields.io/npm/v/instant.dev?label="></h1>
  <img src="/_assets/instant.png" height="128">
  <h3>
    <a href="https://github.com/instant-dev/orm">@instant.dev/orm</a> <img alt="npm" src="https://img.shields.io/npm/v/@instant.dev/orm?label="> <img alt="build status" src="https://app.travis-ci.com/instant-dev/orm.svg?branch=main">
  </h3>
  <hr>
</div>

# Build APIs with JavaScript and Postgres, fast.

## Rails-inspired JavaScript ORM and Migrations for Postgres

[**`instant.dev`**](https://instant.dev) provides a fast, reliable and
battle-tested ORM and migration management system for Postgres 13+ built in
JavaScript. For those familiar with Ruby on Rails, instant.dev adds
functionality similar to ActiveRecord to the Node.js, Deno and Bun ecosystems.
We have been using it since 2016 in production at
[Autocode](https://autocode.com) where it has managed over 1 billion records in
a 4TB AWS Aurora Postgres instance.

**`instant.dev` is designed to work with any JavaScript stack**.
It can be used with CommonJS, ESM and TypeScript projects out of the box: there
is no build step required to use the library. Generated model files use ESM
syntax but can easily be converted to CJS. Our experience is that the majority
of database input errors comes from parsing user land input — like POST requests
— at runtime; in that vein we've packaged type coercion and safety mechanisms
into model lifecycle management with validations, verifications and
transactions.

With `instant.dev` you can:

- Add the [Instant ORM](https://github.com/instant-dev/orm) and migrations to
  your existing JavaScript or TypeScript project
- Scaffold new Postgres-backed API projects from scratch using
  [Autocode](https://autocode.com) or [Vercel](https://vercel.com)
- Generate new migrations, models and endpoints
- Migrate remote databases and deploy in a single step
- Connect to any PostgreSQL host: AWS RDS, Railway, Vercel Postgres, Neon,
  Supabase

Are you interested in connecting? [Join us on Discord](https://discord.gg/puVYgA7ZMh) or follow us on
X, [@instantdevs](https://x.com/instantdevs).

<div align="center">
  <img src="/_assets/instant-demo.gif"><br>
</div>

## Features

- [**CRUD operations**](#crud-operations)
  - Create, Read, Update and Destroy records easily
- [**Query composition**](#query-composition)
  - Build complex SELECT and UPDATE queries with many layers of nested joins and
    conditional statements
- [**Transactions**](#transactions)
  - Ensure data consistency within logical transaction blocks that can be rolled
    back to prevent writing orphaned data
- [**Input validation**](#input-validation)
  - Synchronously validate object fields to ensure the right data is stored
- [**Relationship verification**](#relationship-verification)
  - Asynchronously validate relationships between one or more fields and
    external resources before saving
- [**Calculated and hidden fields**](#calculated-and-hidden-fields)
  - Automatically populate object fields based on existing data
- [**Lifecycle callbacks**](#lifecycle-callbacks)
  - Execute custom logic beforeSave(), afterSave(), beforeDestroy() and
    afterDestroy() to perform necessary build and teardown steps inside of
    transactions
- [**Migrations**](#migrations)
  - Manage local database state via the filesystem to make branched git
    development a breeze
- [**Seeding**](#seeding)
  - Provide custom JSON files so that all developers can share the same test
    data across development, testing and staging environments
- [**Code generation**](#code-generation)
  - Automatically generate models, migrations and endpoints for your project

## Table of Contents

1. [Installation and Usage](#installation-and-usage)
2. [Getting Started](#getting-started)
3. [Using the `instant` CLI](#using-the-instant-cli)
4. [Using the Instant ORM](#using-the-instant-orm)
5. [Feature breakdown](#feature-breakdown)
6. [Kits](#kits)
   1. [Kit: auth](#kit-auth)
      1. [Kit: auth on Autocode](#kit-auth-on-autocode)
      2. [Kit: auth on Vercel](#kit-auth-on-vercel)
7. [Acknowledgements](#acknowledgements)

## Installation and Usage

```shell
npm i instant.dev -g
cd ~/projects/my-awesome-project
instant init
```

That's it! The command line tool will walk you through the process of
initializing your `instant.dev` project. It will;

- Automatically detect whether this is a new project or an existing one
- Scaffold a new [Vercel](https://vercel.com) or [Autocode](https://autocode.com)
  project, if necessary
- Ask for your local database credentials
- Initialize necessary files in the `_instant/` directory of your project
- Create an initial migration

To install the basic `auth` kit which comes with a `User` and `AccessToken`
model and associated user registration and login endpoints, use:

```shell
instant kit auth
```

You can read more in [Kit: auth](#kit-auth)

## Using the `instant` CLI

You can look up documentation for the `instant` command line utility at any
point by running `instant` or `instant help`. The most commonly used methods
are:

- `instant g:model` to create a new model
- `instant g:relationship` to create one-to-one or one-to-many relationships
  between models
- `instant g:endpoint` to automatically scaffold Vercel or Autocode endpoints,
  if applicable
- `instant db:migrate` to run migrations
- `instant db:rollback` to rollback migrations
- `instant db:rollbackSync` to rollback to last synchronized (filesystem x
  database) migration
- `instant db:bootstrap` to reset your database, run migrations, and seed data
- `instant db:add` to add remote databases (AWS RDS, Railway, Vercel Postgres,
  Neon, Supabase)
- `instant serve` to run your server using Vercel, Autocode or the command
  specified in `package.json["scripts"]["start"]`
- `instant sql` is a shortcut to `psql` into any of your databases
- `instant deploy` to run outstanding migrations and deploy to Vercel or
  Autocode

## Using the Instant ORM

Full documentation for the ORM can be found in the
[@instant.dev/orm](https://github.com/instant-dev/orm) repository. Here's
a quick overview of using the ORM:

Importing with CommonJS:

```javascript
const InstantORM = require('@instant.dev/orm');
const Instant = new InstantORM();
```

Importing with ESM:

```javascript
import InstantORM from '@instant.dev/orm';
const Instant = new InstantORM();
```

Using the ORM:

```javascript
// Connect to your database
// Defaults to using instant/db.json[process.env.NODE_ENV || 'development']
await Instant.connect();

// Get the user model: can also use 'user', 'users' to same effect
const User = Instant.Model('User');

// Create a user
let user = await User.create({username: 'Billy'});

// log user JSON
// {id: 1, username: 'Billy', created_at: '...', updated_at: '...'}
console.log(user.toJSON());

// Create multiple models at once
const UserFactory = Instant.ModelFactory('User');
let createdUsers = await UserFactory.create([
  {username: 'Sharon'},
  {username: 'William'},
  {username: 'Jill'}
]);

// Retrieves users with username containing the string 'ill'
let users = await User.query()
  .where({username__icontains: 'ill'})
  .orderBy('username', 'ASC')
  .select();

// [{username: 'Billy'}, {username: 'Jill'}, {username: 'William'}]
console.log(users.toJSON());

users[0].set('username', 'Silly Billy');
await users[0].save();

// [{username: 'Silly Billy'}, {username: 'Jill'}, {username: 'William'}]
console.log(users.toJSON());
```

## Feature breakdown

### CRUD operations

```javascript
const User = Instant.Model('User');

/* Create */
let user = await User.create({
  email: 'keith@instant.dev',
  username: 'keith'
});
// Can also use new keyword to create, must save after
user = new User({
  email: 'keith@instant.dev',
  username: 'keith'
});
await user.save();

/* Read */
user = await User.find(1); // uses id
user = await User.findBy('email', 'keith@instant.dev');
user = await User.query()
  .where({email: 'keith@instant.dev'})
  .first();
let users = await User.query()
  .where({email: 'keith@instant.dev'})
  .select();

/* Update */
user.set('username', 'keith_h');
await user.save();

// Update by reading from data
user.read({username: 'keith_h'});
await user.save();

// Update or Create By
user = await User.updateOrCreateBy(
  'username',
  {username: 'keith', email: 'keith+new@instant.dev'}
);

// Update query: this will bypass validations and verifications
users = await User.query()
  .where({username: 'keith_h'})
  .update({username: 'keith'});

/* Destroy */
await user.destroy();
await user.destroyCascade(); // destroy model + children (useful for foreign keys)

/* ModelArray methods */
users.setAll('username', 'instant');
users.readAll({username: 'instant'});
await users.saveAll();
await users.destroyAll();
await users.destroyCascade();
```

### Query composition

```javascript
const User = Instant.Model('User');

// Basic querying
let users = await User.query()
  .where({id__in: [7, 8, 9]})
  .orderBy('username', 'ASC')
  .limit(2)
  .select();

// Query with OR by sending in a list of where objects
users = await User.query()
  .where( // Can pass in arguments or an array
    {id__in: [7, 8, 9]},
    {username__istartswith: 'Rom'}
  )
  .select();

// evaluate custom values with SQL commands
// in this case, get users where their username matches the first part of their
// email address
users = await User.query()
  .where({
    username: email => `SPLIT_PART(${email}, '@', 1)`
  })
  .select();

// Joins
users = await User.query()
  .join('posts', {title__icontains: 'hello'}) // JOIN ON
  .where({
    username: 'fred',
    posts__like_count__gt: 5 // query joined table
  })
  .select();
users.forEach(user => {
  let posts = user.joined('posts');
  console.log(posts.toJSON()); // log all posts
});

// Deeply-nested joins:
// only get users who have followers that have posts with images from imgur
users = await User.query()
  .join('followers__posts__images')
  .where({followers__posts__images__url__contains: 'imgur.com'})
  .select();
// Access user[0].followers[0].posts[0].images[0] with...
users[0].joined('followers')[0].joined('posts')[0].joined('images')[0];

// Queries are immutable and composable
// Each command creates a new query object from the previous one
let query = User.query();
let query2 = query.where({username__istartswith: 'Rom'});
let query3 = query2.orderBy('username', 'ASC');
let allUsers = await query.select();
let romUsers = await query2.select();
let orderedUsers = await query3.select();

// You can also just query raw SQL!
await Instant.database().query(`SELECT * FROM users`);
```

### Transactions

```javascript
const User = Instant.Model('User');
const Account = Instant.Model('Account');

const txn = Instant.database().createTransaction();

const user = await User.create({email: 'keith@instant.dev'}, txn);
const account = await Account.create({user_id: user.get('id')}, txn);
await txn.commit(); // commit queries to database
// OR...
await txn.rollback(); // if anything went wrong, rollback nullifies the queries

// Can pass transactions to the following Class methods
await Model.find(id, txn);
await Model.findBy(field, value, txn);
await Model.create(data, txn);
await Model.update(id, data, txn);
await Model.updateOrCreateBy(field, data, txn);
await Model.query().count(txn);
await Model.query().first(txn);
await Model.query().select(txn);
await Model.query().update(fields, txn);
// Instance methods
await model.save(txn);
await model.destroy(txn);
await model.destroyCascade(txn);
// Instance Array methods
await modelArray.saveAll(txn);
await modelArray.destroyAll(txn);
await modelArray.destroyCascade(txn);
```

### Input validation

File: `_instant/models/user.mjs`

```javascript
import InstantORM from '@instant.dev/orm';

class User extends InstantORM.Core.Model {

  static tableName = 'users';

}

// Validates email and password before .save()
User.validates(
  'email',
  'must be valid',
  v => v && (v + '').match(/.+@.+\.\w+/i)
);
User.validates(
  'password',
  'must be at least 5 characters in length',
  v => v && v.length >= 5
);

export default User;
```

Now validations can be used;

```javascript
const User = Instant.Model('User');

try {
  await User.create({email: 'invalid'});
} catch (e) {
  // Will catch a validation error
  console.log(e.details);
  /*
    {
      "email": ["must be valid"],
      "password": ["must be at least 5 characters in length"]
    }
  */
}
```

### Relationship verification

File: `_instant/models/user.mjs`

```javascript
import InstantORM from '@instant.dev/orm';

class User extends InstantORM.Core.Model {

  static tableName = 'users';

}

// Before saving to the database, asynchronously compare fields to each other
User.verifies(
  'phone_number',
  'must correspond to country and be valid',
  async (phone_number, country) => {
    let phoneResult = await someAsyncPhoneValidationAPI(phone_number);
    return (phoneResult.valid === true && phoneResult.country === country);
  }
);

export default User;
```

Now verifications can be used;

```javascript
const User = Instant.Model('User');

try {
  await User.create({phone_number: '+1-416-555-1234', country: 'SE'});
} catch (e) {
  // Will catch a validation error
  console.log(e.details);
  /*
    {
      "phone_number": ["must correspond to country and be valid"],
    }
  */
}
```

### Calculated and hidden fields

File: `_instant/models/user.mjs`

```javascript
import InstantORM from '@instant.dev/orm';

class User extends InstantORM.Core.Model {

  static tableName = 'users';

}

User.calculates(
  'formatted_name',
  (first_name, last_name) => `${first_name} ${last_name}`
);
User.hides('last_name');

export default User;
```

```javascript
const User = Instant.Model('User');

let user = await User.create({first_name: 'Steven', last_name: 'Nevets'});
let name = user.get('formatted_name') // Steven Nevets
let json = user.toJSON();
/*
  Last name is hidden from .hides()
  {
    first_name: 'Steven',
    formatted_name: 'Steven Nevets'
  }
*/
```

### Lifecycle callbacks

File: `_instant/models/user.mjs`

```javascript
import InstantORM from '@instant.dev/orm';

class User extends InstantORM.Core.Model {

  static tableName = 'users';

  async beforeSave (txn) {
    const NameBan = this.getModel('NameBan');
    const nameBans = NameBan.query()
      .where({username: this.get('username')})
      .limit(1)
      .select(txn);
    if (nameBans.length) {
      throw new Error(`Username "${this.get('username')}" is not allowed`);
    }
  }

  async afterSave (txn) {
    // Create an account after the user id is set
    // But only when first creating the user
    if (this.isCreating()) {
      const Account = this.getModel('Account');
      await Account.create({user_id: this.get('id')}, txn);
    }
  }

  async beforeDestroy (txn) { /* before we destroy */ }
  async afterDestroy (txn) { /* after we destroy */ }

}

export default User;
```

### Migrations

```shell
instant g:migration
```

Can be used to generate migrations like:

```json
{
  "id": 20230921192702,
  "name": "create_users",
  "up": [
    [
      "createTable",
      "users",
      [
        {
          "name": "email",
          "type": "string",
          "properties": {
            "nullable": false,
            "unique": true
          }
        },
        {
          "name": "password",
          "type": "string",
          "properties": {
            "nullable": false
          }
        }
      ]
    ]
  ],
  "down": [
    [
      "dropTable",
      "users"
    ]
  ]
}
```

### Seeding

Reset your database and seed values from `_instant/seed.json`;

```shell
instant db:bootstrap
```

`seed.json` is an Array of seeds. Anything in the same object is seeded
simultaneously and there are no guarantees on order. Otherwise, the seeds are
run in the order provided by the Array.

```json
[
  {
    "User": [
      {"email": "keith@instant.dev"}
    ]
  },
  {
    "User": [{"email": "scott@instant.dev"}],
    "Post": [{"title": "Post by Keith", "user_id": 1}]
  }
]
```

### Code Generation

Five types of code generation are supported:

- **Kits**: Generated from `src/[framework]/kits`, add in complete models,
  migrations and automatically adds dependencies
  - `instant kit [kitName]`
- **Models**: Generates a new model and associated migration
  - `instant g:endpoint`
- **Migrations**: Generates a new migration
  - `instant g:migration`
- **Relationships**: Generates a new migration that connect models in a
  one-to-one or many-to-many orientation
  - `instant g:relationship`
- **Endpoints**: Generates CRUD endpoints for a model from `src/[framework]/endpoint`
  - `instant g:endpoint`

## Kits

Kits provide an easy way to add complex functionality to your `instant.dev` apps
without having to write code from scratch. Currently kits support development
using [Autocode](https://autocode.com/) and [Vercel](https://vercel.com/).

Note that the [Autocode CLI](https://github.com/acode/cli) comes packaged with
its own HTTP wrapper, where `lib .fn.name` will call `/fn/name` on the service
with a POST request. The `-a` option is shorthand for providing an
`Authorization: Bearer` header.

### Kit: auth

```shell
instant kit auth
```

Creates a `User` and `AccessToken` model, as well as corresponding
endpoints.

#### Kit: auth on Autocode

##### POST `users/create`

```shell
lib .users.create \
  --email keith@instant.dev \
  --password mypass \
  --repeat_password=mypass
```

```json
{
  "id": 1,
  "email": "keith@instant.dev",
  "created_at": "2023-09-18T22:46:44.866Z",
  "updated_at": "2023-09-18T22:46:44.940Z"
}
```

##### POST `auth`

```shell
lib .auth \
  --username keith@instant.dev \
  --password=mypass \
  --grant_type=password
```

```json
{
  "key": "secret_development_XXX",
  "ip_address": "::ffff:127.0.0.1",
  "user_agent": "curl/7.79.1",
  "expires_at": "2023-10-18T22:53:36.967Z",
  "is_valid": true,
  "created_at": "2023-09-18T22:53:36.967Z",
  "updated_at": "2023-09-18T22:53:36.967Z",
}
```

##### GET `users/me`

```shell
lib .users.me -a secret_development_XXX
```

```json
{
  "id": 1,
  "email": "keith@instant.dev",
  "created_at": "2023-09-18T22:46:44.866Z",
  "updated_at": "2023-09-18T22:46:44.940Z"
}
```

##### GET `users`

```shell
lib .users -a secret_development_XXX
```

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

#### Kit: auth on Vercel

##### POST `api/users`

```shell
curl localhost:3000/api/users --data \
  "email=keith@instant.dev&password=mypass&repeat_password=mypass"
```

```json
{
  "id": 1,
  "email": "keith@instant.dev",
  "created_at": "2023-09-18T22:46:44.866Z",
  "updated_at": "2023-09-18T22:46:44.940Z"
}
```

##### POST `api/auth`

```shell
curl localhost:3000/api/auth --data \
  "username=keith@instant.dev&password=mypass&grant_type=password"
```

```json
{
  "key": "secret_development_XXX",
  "ip_address": "::ffff:127.0.0.1",
  "user_agent": "curl/7.79.1",
  "expires_at": "2023-10-18T22:53:36.967Z",
  "is_valid": true,
  "created_at": "2023-09-18T22:53:36.967Z",
  "updated_at": "2023-09-18T22:53:36.967Z",
}
```

##### GET `api/users/me`

```shell
curl localhost:3000/api/users/me \
  -H "Authorization: Bearer secret_development_XXX"
```

```json
{
  "id": 1,
  "email": "keith@instant.dev",
  "created_at": "2023-09-18T22:46:44.866Z",
  "updated_at": "2023-09-18T22:46:44.940Z"
}
```

##### GET `api/users`

```shell
curl localhost:3000/api/users \
  -H "Authorization: Bearer secret_development_XXX"
```

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

# Acknowledgements

Special thank you to [Scott Gamble](https://x.com/threesided) who helps run all of the front-of-house work for instant.dev 💜!

| Destination | Link |
| ----------- | ---- |
| Home | [instant.dev](https://instant.dev) |
| GitHub | [github.com/instant-dev](https://github.com/instant-dev) |
| Discord | [discord.gg/puVYgA7ZMh](https://discord.gg/puVYgA7ZMh) |
| X / instant.dev | [x.com/instantdevs](https://x.com/instantdevs) |
| X / Keith Horwood | [x.com/keithwhor](https://x.com/keithwhor) |
| X / Scott Gamble | [x.com/threesided](https://x.com/threesided) |
