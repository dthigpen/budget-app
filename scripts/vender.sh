#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
set -x

# vender css
rm -rf public/css/vender
mkdir -p public/css/vender

cp node_modules/@picocss/pico/css/pico.min.css public/css/vender/pico.min.css

# vender js
rm -rf public/js/vender
mkdir -p public/js/vender

# cp -r node_modules/@shoelace-style/shoelace public/js/vender/shoelace
cp -r node_modules/chart.js/dist/chart.umd.js public/js/vender/chart.umd.js
