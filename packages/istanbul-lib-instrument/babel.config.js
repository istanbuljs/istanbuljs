'use strict';

/* This is used by babel 7 only, .babelrc is used by babel 6 allowing us to deal with
 * conflicting 'env' preset between build and documentation. */
module.exports = {
	"babelrc": false,
	"presets": ["@babel/env"]
};
