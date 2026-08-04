# docgen

A CLI tool that generates Markdown API documentation from the diff between two git commits. It answers a real question: when an API changes, how do you keep the docs honest without someone remembering to update them by hand?

## What it does

Point it at a repo, a file, and two git refs. It:

1. Pulls the file's content at both refs directly from git history (no working-directory checkout required)
2. Parses both versions with a real JavaScript AST parser (`@babel/parser`), not regex guessing
3. Finds every Express-style route (`router.get(...)`, `router.post(...)`, etc.), extracts its JSDoc comment, and identifies which parameters the handler actually destructures from `req.body` / `req.query` / `req.params`
4. Diffs the two route sets by method + path, classifying each as **added**, **changed** (signature or description differs), **removed**, or **unchanged**
5. Generates a Markdown document grouped by what actually needs a reviewer's attention: new endpoints first, then changed endpoints with a plain-language "what changed" callout, then a flagged warning for anything that disappeared

## Example

```bash
node docgen.js \
  --repo ./my-api \
  --file routes/users.js \
  --from a1b2c3d \
  --to HEAD \
  --out ./docs/api-update.md
```

Given a diff that adds a new `PATCH /users/:id` endpoint and adds a `role` parameter to two existing routes, it produces:

```markdown
## New Endpoints

### PATCH `/users/:id` 🆕

Update an existing user's profile.

| Parameter | Type | Description |
|---|---|---|
| `req.params.id` | string | The ID of the user to update |
| `req.body.name` *(optional)* | string | Updated display name |

## Changed Endpoints

### POST `/users` ✏️ *(signature changed)*
...
> **What changed:** added parameter `req.body.role`.
```

Removed endpoints get an explicit warning rather than silently disappearing from the docs:

```markdown
## Removed Endpoints

> ⚠️ These endpoints existed in the previous version and were not found
> in the current one. Confirm this is intentional before publishing.

- **PATCH `/users/:id`** — Update an existing user's profile.
```

## Why I built it

Docs go stale because nothing connects a code change to a documentation change. Writers aren't careless; there's just no mechanism forcing the two to move together. This tool reads the actual AST of both versions and diffs the real structure, so the documentation reflects what the code does rather than what someone remembered to write down.

## Current scope and honest limitations

- **Express-style route handlers only.** `router.METHOD('/path', handler)` — other frameworks or route-definition patterns aren't recognized yet.
- **JSDoc-driven.** If a route has no JSDoc comment, its documentation will be minimal (method, path, and any params the tool can infer from destructuring, but no description).
- **Destructuring detection is pattern-based, not a full data-flow analysis.** It looks for `const { x, y } = req.body` at the top level of a handler; parameters accessed another way (`req.body.x` inline, or destructured deeper in nested logic) won't be picked up.
- **No prose generation beyond what JSDoc already provides.** The tool structures and formats what's already written in comments — it doesn't currently call out to an LLM to draft new descriptive text for undocumented code. That's a natural next step (see below).

## What I'd build next

- Wire in the Claude API to draft a plain-language description for routes that have no JSDoc at all, using the function body as context — turning this from "structures existing documentation" into "drafts documentation from scratch when none exists"
- Support for additional route-definition patterns (Fastify, Koa, raw `app.METHOD` calls)
- A `--watch` mode that runs on every commit to a branch, rather than a one-off diff between two refs

## Tech

Node.js, `@babel/parser` + `@babel/traverse` for AST parsing, `commander` for the CLI interface, `simple-git` for reading file content directly from git history without a checkout.

## Author

Roger Smith II — [rsmithii.com](https://www.rsmithii.com)
