#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
set -x

bash scripts/vender.sh

npx web-dev-server --hostname 0.0.0.0 --port 8080 --root-dir ./public --app-index index.html --watch
