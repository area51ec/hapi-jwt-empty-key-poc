# Reproduction

## Requirements

- Node.js 22 (tested with 22.23.4)
- npm
- Optional: Docker, to run the same steps in a container

## Steps

```sh
git clone <this repository>
cd hapi-jwt-empty-key-poc
npm ci --ignore-scripts
node poc/run.js vulnerable   # @hapi/jwt 3.2.4
node poc/run.js fixed        # @hapi/jwt 3.2.5
```

Each run prints a table with the status code for each case, the expected status,
and a final `RESULT` line. The process exits with 0 when every case matches the
expected behaviour, and with 1 otherwise.

## Docker

```sh
docker build -t hapi-jwt-poc .
docker run --rm hapi-jwt-poc
```

The container runs both versions. It does not publish any port.

## Versions in use

`package.json` installs both versions as npm aliases:

- `@hapi/jwt-vulnerable` = `npm:@hapi/jwt@3.2.4`
- `@hapi/jwt-fixed` = `npm:@hapi/jwt@3.2.5`

`@hapi/hapi` is pinned to 21.4.14.
