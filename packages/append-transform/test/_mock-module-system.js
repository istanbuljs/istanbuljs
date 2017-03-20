'use strict';

var appendTransform = require('../');
var ModuleSystem = require('fake-module-system');

ModuleSystem.prototype.installConventionalTransform = function (transformFn, ext) {
	ext = ext || '.js';
	var originalExtension = this.extensions[ext];

	this.extensions[ext] = function (module, filename) {
		var originalCompile = module._compile;
		module._compile = function (code, filename) {
			module._compile = originalCompile;
			module._compile(transformFn(code, filename), filename);
		};

		originalExtension(module, filename);
	};
};

ModuleSystem.prototype.appendTransform = function (transform, ext) {
	return appendTransform(transform, ext, this.extensions);
};

module.exports = ModuleSystem;

