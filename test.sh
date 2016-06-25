#!/bin/bash

HARMONY=--harmony
if [[ `node --version` =~ ^v0.10 ]]
then
    HARMONY=
fi

node ${HARMONY} ./node_modules/istanbul/lib/cli.js cover \
    ./node_modules/.bin/_mocha -- \
    --compilers js:babel-core/register --recursive \
    test/
