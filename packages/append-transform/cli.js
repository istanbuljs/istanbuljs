#!/usr/bin/env node
'use strict';
var meow = require('meow');
var requireExtensionListener = require('./');

var cli = meow([
	'Usage',
	'  $ require-extension-listener [input]',
	'',
	'Options',
	'  --foo  Lorem ipsum. [Default: false]',
	'',
	'Examples',
	'  $ require-extension-listener',
	'  unicorns & rainbows',
	'  $ require-extension-listener ponies',
	'  ponies & rainbows'
]);

console.log(requireExtensionListener(cli.input[0] || 'unicorns'));
