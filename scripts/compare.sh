#!/bin/sh
# Runs the PoC against @hapi/jwt 3.2.4 (vulnerable) and 3.2.5 (fixed).
# Expected: vulnerable -> attack cases 500/200, control 200; fixed -> attack cases 401, control 200.
set -e
cd "$(dirname "$0")/.."
node poc/run.js vulnerable
node poc/run.js fixed
