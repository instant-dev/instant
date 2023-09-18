# Instant.dev Command Line Interface

To begin;

```shell
$ npm i instant.dev -g
$ cd my-project-dir
$ instant init
```

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
