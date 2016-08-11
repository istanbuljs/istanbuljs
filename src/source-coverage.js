import {classes} from 'istanbul-lib-coverage';

function cloneLocation(loc) {
    return {
        start: {
            line: loc && loc.start.line,
            column: loc && loc.start.column
        },
        end: {
            line: loc && loc.end.line,
            column: loc && loc.end.column
        }
    };
}
/**
 * SourceCoverage provides mutation methods to manipulate the structure of
 * a file coverage object. Used by the instrumenter to create a full coverage
 * object for a file incrementally.
 *
 * @private
 * @param pathOrObj {String|Object} - see the argument for {@link FileCoverage}
 * @extends FileCoverage
 * @constructor
 */
class SourceCoverage extends classes.FileCoverage {
    constructor(pathOrObj) {
        super(pathOrObj);
        this.meta = {
            last: {
                s: 0,
                f: 0,
                b: 0
            }
        };
    }

    newStatement(loc) {
        this.meta.last.s += 1;
        var s = this.meta.last.s;
        this.data.statementMap[s] = cloneLocation(loc);
        this.data.s[s] = 0;
        return s;
    }

    newFunction(name, decl, loc) {
        this.meta.last.f += 1;
        var f = this.meta.last.f;
        name = name || '(anonymous_' + f + ')';
        this.data.fnMap[f] = {
            name: name,
            decl: cloneLocation(decl),
            loc: cloneLocation(loc)
        };
        this.data.f[f] = 0;
        return f;
    }

    newBranch(type, loc) {
        this.meta.last.b += 1;
        var b = this.meta.last.b;
        this.data.b[b] = [];
        this.data.branchMap[b] = {
            loc: cloneLocation(loc),
            type: type,
            locations: []
        };
        return b;
    }

    addBranchPath(name, location) {
        var bMeta = this.data.branchMap[name],
            counts = this.data.b[name];

        /* istanbul ignore if: paranoid check */
        if (!bMeta) {
            throw new Error("Invalid branch " + name);
        }
        bMeta.locations.push(cloneLocation(location));
        counts.push(0);
        return counts.length - 1;
    }

    freeze() {
        // prune empty branches
        var map = this.data.branchMap,
            branches = this.data.b;
        Object.keys(map).forEach(function (b) {
            if (map[b].locations.length === 0) {
                delete map[b];
                delete branches[b];
            }
        });
    }
}

export { SourceCoverage };
