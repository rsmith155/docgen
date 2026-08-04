# docgen

A CLI tool that generates Markdown API documentation from the diff between two git commits. It answers a real question: when an API changes, how do you keep the docs honest without someone remembering to update them by hand?

**[Full writeup and tool details →](./cli/README.md)**

## Repo structure

```
docgen-project/
├── cli/              the actual tool
│   ├── docgen.js
│   ├── lib/
│   └── README.md      full documentation, usage, and design notes
└── demo-api/          a real git repo used to test the tool
    └── routes/users.js  three real commits: added, changed, and removed endpoints
```

## Quick start

```bash
cd cli
npm install
node docgen.js \
  --repo ../demo-api \
  --file routes/users.js \
  --from d4b7146 \
  --to 2e62e3f \
  --out ../docs/output.md
```

This runs the tool against the included demo repo's real commit history and generates a documentation update showing one new endpoint and two changed ones.

## What it does

Points at a repo, a file, and two git refs. Parses both versions with a real JavaScript AST parser (not regex guessing), finds every Express-style route, extracts its JSDoc comment and the parameters its handler actually uses, diffs the two versions, and generates a Markdown document grouped by what needs a reviewer's attention: new endpoints first, then changed endpoints with a plain-language summary of what changed, then a flagged warning for anything that disappeared.

See [cli/README.md](./cli/README.md) for full usage details, design decisions, and honest scope limitations.

## Author

Roger Smith II — [rsmithii.com](https://www.rsmithii.com)
