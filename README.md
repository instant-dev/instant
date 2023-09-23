# instant.dev ![Build Status](https://app.travis-ci.com/instant-dev/orm.svg?branch=main)

## Rails-inspired JavaScript ORM and Migrations for Postgres

[**instant.dev**](https://instant.dev) provides a fast, reliable, and
battle-tested ORM and migration management system for Postgres 13+ built in
JavaScript. For those familiar with Ruby on Rails, you can think of instant.dev
like ActiveRecord for the Node.js, Deno and Bun ecosystems. We’ve been using it
since 2016 in production at [Autocode](https://autocode.com) where it has
managed over 1 billion records in a 4TB AWS Aurora Postgres instance.

Use instant.dev to:

- Add the [Instant ORM](https://githib.com/instant-dev/orm) and migrations to
  your existing JavaScript project
- Scaffold new Postgres-backed API projects from scratch using
  [Autocode](https://autocode.com) or [Vercel](https://vercel.com)
- Generate new migrations, models and endpoints
- Migrate remote databases and deploy in a single step
- Connect to any PostgreSQL host: AWS RDS, Railway, Vercel Postgres, Neon,
  Supabase

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

## Table of Contents

1. [Installation and Usage](#installation-and-usage)
2. [Getting Started](#getting-started)
3. [Using `instant`](#using-instant)
4. [Using the Instant ORM](#using-the-instant-orm)
5. [Feature breakdown](#feature-breakdown)
   1. [CRUD operations](#crud-operations)
   2. [Query composition](#query-composition)
   3. [Transactions](#transactions)
   4. [Input validation](#input-validation)
   5. [Relationship verification](#relationship-verification)
   6. [Calculated fields](#calculated-fields)
   7. [Lifecycle callbacks](#lifecycle-callbacks)
   8. [Migrations](#migrations)
   9. [Seeding](#seeding)
   10. [Code Generation](#code-generation)
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
initializing your instant.dev project. It will;

- Automatically detect whether this is a new project or an existing one
- Scaffold a new [Vercel](https://vercel.com) or [Autocode](https://autocode.com)
  project, if necessary
- Ask for your local database credentials
- Initialize necessary files in the `_instant/` directory of your project
- Create an initial migration

## Getting started

If you're getting started from scratch and want a working project right away,
instant.dev comes with **kits**: sets of models and their corresponding
migrations that add complex functionality to your app without having to figure
it all out yourself.

To install the basic `auth` kit which comes with a `User` and `AccessToken`
model and associated user registration and login endpoints, use:

```shell
instant kit auth
```

You can read more in [Kits: auth](#kits-auth)

## Using `instant`

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
- `instant sql` is a shortcut to `psql` in to any of your databases
- `instant deploy` to run outstanding migrations and deploy to Vercel or
  Autocode

## Using the Instant ORM

Full documentation for the ORM can be found in the
[@instant.dev/orm](https://github.com/instant-dev/orm) repository. Here is a
quick example of how you can use the Instant ORM.

```javascript
const Instant = require('@instant.dev/orm')();

// Connect to your database
// Defaults to using instant/db.json[process.env.NODE_ENV || 'local']
await Instant.connect();

// Get the user model: can also use 'user', 'users' to same effect
const User = Instant.Model('User');

// Create a user
let user = await User.create({username: 'Billy'});

// log user JSON
// {id: 1, username: 'Billy', created_at: '...', updated_at: '...'}
console.log(user.toJSON());

let user2 = await User.create({username: 'Sharon'});
let user3 = await User.create({username: 'William'});
let user4 = await User.create({username: 'Jill'});

// Retrieves users with username containing the string 'ill'
let users = await User.query()
  .where({username__icontains: 'ill'})
  .orderBy('username', 'ASC')
  .select();

// [{username: 'Billy'}, {username: 'Jill'}, {username: 'William'}]
console.log(users.toJSON());
```

## Feature breakdown

### CRUD operations

### Query composition

### Transactions

### Input validation

### Relationship verification

### Calculated fields

### Lifecycle callbacks

### Migrations

### Seeding

### Code Generation

## Kits

Kits provide an easy way to add complex functionality to your instant.dev apps
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

Thanks!
