/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";

var util = require('util'),
    BaseCoverage = require('istanbul-lib-coverage').classes.FileCoverage;

/**
 * SourceCoverage provides mutation methods to manipulate the structure of
 * a file coverage object. Used by the instrumenter to create a full coverage
 * object for a file incrementally.
 *
 * @param pathOrObj {String|Object} - see the argument for {@link FileCoverage}
 * @extends FileCoverage
 * @constructor
 */
function SourceCoverage(pathOrObj) {
    BaseCoverage.call(this, pathOrObj);
    this.meta = {
        last: {
            s: 0,
            f: 0,
            b: 0
        }
    };
}

util.inherits(SourceCoverage, BaseCoverage);

// adds a new statement for the supplied location and
// returns its index into the statement map
SourceCoverage.prototype.newStatement = function (loc) {
    this.meta.last.s += 1;
    var s = this.meta.last.s;
    this.data.statementMap[s] = this.cloneLocation(loc);
    this.data.s[s] = 0;
    return s;
};
// adds a new function with the given name, a location for the
// function declaration and another for the entire function span
SourceCoverage.prototype.newFunction = function (name, decl, loc) {
    this.meta.last.f += 1;
    var f = this.meta.last.f;
    name = name || '(anonymous_' + f + ')';
    this.data.fnMap[f] = {
        name: name,
        decl: this.cloneLocation(decl),
        loc: this.cloneLocation(loc)
    };
    this.data.f[f] = 0;
    return f;
};
// add a new branch of the specified type for the supplied start
// location
SourceCoverage.prototype.newBranch = function (type, loc) {
    this.meta.last.b += 1;
    var b = this.meta.last.b;
    this.data.b[b] = [];
    this.data.branchMap[b] = {
        loc: loc,
        type: type,
        locations: []
    };
    return b;
};

SourceCoverage.prototype.addBranchPath = function (name, location) {
    var bMeta = this.data.branchMap[name],
        counts = this.data.b[name];

    if (!bMeta) {
        throw new Error("Invalid branch " + name);
    }
    bMeta.locations.push(this.cloneLocation(location));
    counts.push(0);
    return counts.length - 1;
};
// runs all locations stored in this coverage object through
// the fixer function for adjusting locations that may be required
// due to source code manipulation
SourceCoverage.prototype.adjustLocations = function (fixer) {
    var map = this.data.statementMap;
    Object.keys(map).forEach(function (s) {
        fixer(map[s]);
    });
    map = this.data.fnMap;
    Object.keys(map).forEach(function (s) {
        fixer(map[s].loc);
    });
    map = this.data.branchMap;
    Object.keys(map).forEach(function (b) {
        map[b].locations.forEach(function (s) {
            fixer(s);
        });
    });
};
// indicates that the file coverage object is now a complete
// representation of the file that was instrumented
SourceCoverage.prototype.freeze = function () {
    // prune empty branches
    var map = this.data.branchMap;
    Object.keys(map).forEach(function (b) {
        if (map[b].locations.length === 0) {
            delete map[b];
        }
    });
    // XXX: compute a sig?
};

// returns a clone of the location object with only
// the attributes of interest
SourceCoverage.prototype.cloneLocation = function (loc) {
    return {
        start: {
            line: loc.start.line,
            column: loc.start.column
        },
        end: {
            line: loc.end.line,
            column: loc.end.column
        }
    };
};

module.exports = SourceCoverage;



