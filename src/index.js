import Instrumenter from './instrumenter';
import programVisitor from './visitor';

function createInstrumenter(opts) {
    return new Instrumenter(opts);
}

export {createInstrumenter};
export {programVisitor};

