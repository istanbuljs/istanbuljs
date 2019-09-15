export default function defaultOpts() {
    return {
        coverageVariable: '__coverage__',
        coverageGlobalScope: 'this',
        coverageGlobalScopeFunc: true,
        preserveComments: false,
        compact: true,
        esModules: false,
        autoWrap: false,
        produceSourceMap: false,
        ignoreClassMethods: [],
        sourceMapUrlCallback: null,
        debug: false,
        /* babel parser plugins are to be enabled when the feature is stage 3 and
         * implemented in a released version of node.js */
        plugins: [
            'asyncGenerators',
            'bigInt',
            'classProperties',
            'classPrivateProperties',
            'dynamicImport',
            'importMeta',
            'objectRestSpread',
            'optionalCatchBinding',
            'flow',
            'jsx'
        ]
    };
}
