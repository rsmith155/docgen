# API Documentation Update

_Generated from diff between `d4b7146` and `2e62e3f`_

**Summary:** 1 added, 2 changed, 0 removed, 0 unchanged.

## New Endpoints

### PATCH `/users/:id` 🆕

Update an existing user's profile.

| Parameter | Type | Description |
|---|---|---|
| `req.params.id` | string | The ID of the user to update |
| `req.body.name` *(optional)* | string | Updated display name |
| `req.body.role` *(optional)* | string | Updated role |

**Returns** `200` Object — The updated user object


## Changed Endpoints

### GET `/users` ✏️ *(signature changed)*

Get a list of all users, optionally filtered by role.

| Parameter | Type | Description |
|---|---|---|
| `req.query.role` *(optional)* | string | Filter users by role (admin, member) |

**Returns** `200` Array — An array of user objects

> **What changed:** added parameter `req.query.role`.

### POST `/users` ✏️ *(signature changed)*

Create a new user.

| Parameter | Type | Description |
|---|---|---|
| `req.body.email` | string | The user's email address |
| `req.body.name` | string | The user's display name |
| `req.body.role` *(optional, default: member)* | string | The user's role (admin, member) |

**Returns** `201` Object — The newly created user object

> **What changed:** added parameter `req.body.role`.
