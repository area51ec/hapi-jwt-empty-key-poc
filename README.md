# hapi-jwt-empty-key-poc

Local proof of concept for **GHSA-c26c-q3fh-3xf7**, an advisory for `@hapi/jwt`
where the value returned by a `keys` function is not validated.

- Affected: `@hapi/jwt` < 3.2.5 (tested: 3.2.4)
- Fixed: `@hapi/jwt` 3.2.5
- Advisory: https://github.com/hapijs/jwt/security/advisories/GHSA-c26c-q3fh-3xf7
- Credit: area51ec

## What it shows

The advisory describes two issues:

1. An empty HMAC key returned by a `keys` function is accepted, including when the
   key object pins `algorithms: ['HS256']`. A token signed with the empty key is
   accepted.
2. An empty string inside an array returned by a `keys` function is read as the
   `none` algorithm, so unsigned tokens are accepted with any `kid`.

`poc/run.js` runs both cases against a local hapi server, plus one control case
with a token signed with the real secret. Tokens are generated locally with
`node:crypto`.

## Expected results

| Case | @hapi/jwt 3.2.4 | @hapi/jwt 3.2.5 |
|---|---|---|
| H1 empty HMAC key (buffer) | accepted (200) | rejected (401) |
| H1 empty key object, `algorithms: ['HS256']` | accepted (200) | rejected (401) |
| H2 empty string in keys array, unsigned token | accepted (200) | rejected (401) |
| Control: token signed with the real secret | accepted (200) | accepted (200) |

On 3.2.4 the first case returns 200 when the key function returns the empty Buffer directly. The empty key object pinned to `algorithms: ['HS256']` also returns 200. See [REPRODUCTION.md](REPRODUCTION.md).

## Scope and limits

- Covers HMAC (HS256) with an empty key and the empty string in a keys array.
- Does not cover RS256, ES256, PS256 or KeyObject values of zero length.
- Does not contact any service. Everything runs on the local machine.
- Do not use this against systems you do not own or have permission to test.

## Running it

See [REPRODUCTION.md](REPRODUCTION.md). Quick version with Node 22:

```sh
npm ci --ignore-scripts
npm run compare
```

## Disclosure

Parts of this repository (code and text) were drafted with AI assistance and then
reviewed and run manually by the author. Results in the tables above come from
running the code, not from the drafts.

## License

MIT. See [LICENSE](LICENSE).
