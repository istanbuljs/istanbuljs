/* globals describe, it */
var assert = require('chai').assert,
  path = require("path"),
  MapStore = require('../lib/map-store').MapStore,
  libCoverage = require("istanbul-lib-coverage");

describe('map store', function () {
  var coverageData;

  it('applies the inputSourceMap from the coverage object if available', function () {
    /* shint ignore:line */
    var mapStore = new MapStore({});

    var coverageMap = libCoverage.createCoverageMap(coverageData);

    var transformed = mapStore.transformCoverage(coverageMap);
    var transformedCoverage = transformed.map.data[path.resolve("./test.ts")].data;

    assert.deepEqual(transformedCoverage.statementMap, {
      "0": {
        "start": {
          "line": 1,
          "column": 0
        },
        "end": {
          "line": 5,
          "column": 0
        }
      },
      "1": {
        "start": {
          "line": 2,
          "column": 4
        },
        "end": {
          "line": 4,
          "column": 5
        }
      },
      "2": {
        "start": {
          "line": 3,
          "column": 8
        },
        "end": {
          "line": 3,
          "column": 26
        }
      },
      "3": {
        "start": {
          "line": 5,
          "column": 0
        },
        "end": {
          "line": 5,
          "column": 1
        }
      },
      "4": {
        "end": {
          "column": 1,
          "line": 5
        },
        "start": {
          "column": 13,
          "line": 1
        }
      }
    });
    assert.deepEqual(transformedCoverage.fnMap, {
      "0": {
        "name": "(anonymous_1)",
        "decl": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": null,
            "column": -1
          }
        },
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": -1
          }
        }
      },
      "1": {
        "name": "(anonymous_3)",
        "decl": {
          "start": {
            "line": 2,
            "column": 4
          },
          "end": {
            "line": null,
            "column": -1
          }
        },
        "loc": {
          "start": {
            "line": 2,
            "column": 4
          },
          "end": {
            "line": 4,
            "column": 5
          }
        }
      }
    });
    assert.deepEqual(transformedCoverage.branchMap, {});
    assert.deepEqual(transformedCoverage.s, {
      "0": 1,
      "1": 1,
      "2": 1,
      "3": 1,
      "4": 1
    });
    assert.deepEqual(transformedCoverage.f, {
      "0": 2,
      "1": 1
    });
    assert.deepEqual(transformedCoverage.b, {});
  });

  // Original source
  // export class SimpleClass {
  //     hy() {
  //         console.log("Hy");
  //     }
  // }
  // Transpiled Source
  // "use strict";
  // var SimpleClass = (function () {
  //     function SimpleClass() {
  //     }
  //     SimpleClass.prototype.hy = function () {
  //         console.log("Hy");
  //     };
  //     return SimpleClass;
  // }());
  // exports.SimpleClass = SimpleClass;
  coverageData = {
    "test.js": {
      "path": "test.js",
      "statementMap": {
        "1": {
          "start": {
            "line": 2,
            "column": 19
          },
          "end": {
            "line": 9,
            "column": 3
          }
        },
        "2": {
          "start": {
            "line": 5,
            "column": 4
          },
          "end": {
            "line": 7,
            "column": 6
          }
        },
        "3": {
          "start": {
            "line": 6,
            "column": 8
          },
          "end": {
            "line": 6,
            "column": 26
          }
        },
        "4": {
          "start": {
            "line": 8,
            "column": 4
          },
          "end": {
            "line": 8,
            "column": 23
          }
        },
        "5": {
          "start": {
            "line": 10,
            "column": 0
          },
          "end": {
            "line": 10,
            "column": 34
          }
        }
      },
      "fnMap": {
        "1": {
          "name": "(anonymous_1)",
          "decl": {
            "start": {
              "line": 2,
              "column": 19
            },
            "end": {
              "line": 2,
              "column": 20
            }
          },
          "loc": {
            "start": {
              "line": 2,
              "column": 31
            },
            "end": {
              "line": 9,
              "column": 1
            }
          }
        },
        "2": {
          "name": "SimpleClass",
          "decl": {
            "start": {
              "line": 3,
              "column": 13
            },
            "end": {
              "line": 3,
              "column": 24
            }
          },
          "loc": {
            "start": {
              "line": 3,
              "column": 27
            },
            "end": {
              "line": 4,
              "column": 5
            }
          }
        },
        "3": {
          "name": "(anonymous_3)",
          "decl": {
            "start": {
              "line": 5,
              "column": 31
            },
            "end": {
              "line": 5,
              "column": 32
            }
          },
          "loc": {
            "start": {
              "line": 5,
              "column": 43
            },
            "end": {
              "line": 7,
              "column": 5
            }
          }
        }
      },
      "branchMap": {},
      "s": {
        "1": 1,
        "2": 1,
        "3": 1,
        "4": 1,
        "5": 1
      },
      "f": {
        "1": 1,
        "2": 1,
        "3": 1
      },
      "b": {},
      inputSourceMap: {
        version: 3,
        file: "test.js",
        sourceRoot: "",
        sources: ["test.ts"],
        names: [],
        mappings: ";AAAA;IAAA;IAIA,CAAC;IAHG,wBAAE,GAAF;QACI,OAAO,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC;IACtB,CAAC;IACL,kBAAC;AAAD,CAAC,AAJD,IAIC;AAJY,mBAAW,cAIvB,CAAA" // jshint ignore:line
      }
    }
  };
});
