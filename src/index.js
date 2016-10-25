import Instrumenter from './instrumenter';
import programVisitor from './visitor';
import readInitialCoverage from './read-coverage';

/**
 * createInstrumenter creates a new instrumenter with the
 * supplied options.
 * @param {Object} opts - instrumenter options. See the documentation
 * for the Instrumenter class.
 */
function createInstrumenter(opts) {
    return new Instrumenter(opts);
}

export {createInstrumenter};
export {programVisitor};
export {readInitialCoverage};
