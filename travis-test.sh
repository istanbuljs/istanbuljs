#!/bin/bash

if [[ `node --version` =~ ^v0.10 ]]
then
	npm run v10-test
else
	npm run test
fi
