# Contributing

## Branch naming convention

Branches follow the pattern:

```
<type>/<short-description>
```

- `<type>` — one of:
  - `feat` — new feature
  - `fix` — bug fix
  - `chore` — tooling, config, or maintenance work with no user-facing behavior change
  - `docs` — documentation only
  - `refactor` — code change that neither fixes a bug nor adds a feature
  - `test` — adding or updating tests
  - `ci` — CI/CD pipeline changes
- `<short-description>` — kebab-case, a few words max, describing the change (no ticket numbers required, but include one if it exists, e.g. `feat/123-user-auth`)

Examples:

```
feat/psn-trophy-sync
fix/login-crash
chore/openspec-setup
docs/branching-convention
```

Keep branch names short and descriptive enough that their purpose is clear from the name alone.
