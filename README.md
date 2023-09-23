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
scaffold a new Postgres-backed API project from scratch. It works out of the box
with any PostgreSQL provider: AWS RDS, Railway, Vercel Postgres, Neon, Supabase.

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

Stay tuned!

# Installation and Usage

```shell
$ npm i instant.dev -g
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

# Installing kits

If you're getting started from scratch and want a working project right away,
instant.dev comes with **kits**: sets of models and their corresponding
migrations that add complex functionality to your app without having to figure
it all out yourself.

If you're starting a new project from scratch, instant.dev comes with **kits**:
sets of models and their corresponding migrations that add complex functionality
to your app without having to figure it all out yourself.

Right now the only available kit is:

```shell
$ instant kit auth
```

Which creates a `User` and `AccessToken` model, as well as corresponding
endpoints, that can be used to register and log in users. We'll be adding more
and welcome contributions!

## Using the `instant` command line utility

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
- `instant deploy` to run outstanding migrations and deploy to Vercel or
  Autocode

## Using the Instant ORM

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
