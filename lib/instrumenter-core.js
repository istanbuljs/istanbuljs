/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
module.exports = function (opts) {
    var SYNTAX,
        SourceCoverage = require('./source-coverage'),
        ESP = opts.parser,
        ESPGEN = opts.codegen,
        generateTrackerVar = opts.vargen,
        LEADER_WRAP = '(function () { ',
        TRAILER_WRAP = '\n}());',
        COMMENT_RE = /^\s*istanbul\s+ignore\s+(if|else|next)(?=\W|$)/,
        SOURCE_MAP_RE = /[#@]\s*sourceMappingURL=(.*)\s*$/m,
        astgen,
        isArray = Array.isArray;

    function pushAll(ary, thing) {
        if (!isArray(thing)) {
            thing = [thing];
        }
        Array.prototype.push.apply(ary, thing);
    }

    SYNTAX = {
        // keep in sync with estraverse's VisitorKeys
        AssignmentExpression: ['left', 'right'],
        AssignmentPattern: ['left', 'right'],
        ArrayExpression: ['elements'],
        ArrayPattern: ['elements'],
        ArrowFunctionExpression: ['params', 'body'],
        AwaitExpression: ['argument'], // CAUTION: It's deferred to ES7.
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ClassBody: ['body'],
        ClassDeclaration: ['id', 'superClass', 'body'],
        ClassExpression: ['id', 'superClass', 'body'],
        ComprehensionBlock: ['left', 'right'],  // CAUTION: It's deferred to ES7.
        ComprehensionExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DebuggerStatement: [],
        DirectiveStatement: [],
        DoWhileStatement: ['body', 'test'],
        EmptyStatement: [],
        ExportAllDeclaration: ['source'],
        ExportDefaultDeclaration: ['declaration'],
        ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
        ExportSpecifier: ['exported', 'local'],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        ForOfStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        GeneratorExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        ImportDeclaration: ['specifiers', 'source'],
        ImportDefaultSpecifier: ['local'],
        ImportNamespaceSpecifier: ['local'],
        ImportSpecifier: ['imported', 'local'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MetaProperty: ['meta', 'property'],
        MemberExpression: ['object', 'property'],
        MethodDefinition: ['key', 'value'],
        ModuleSpecifier: [],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        ObjectPattern: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        RestElement: ['argument'],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SpreadElement: ['argument'],
        SuperExpression: ['super'],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        TaggedTemplateExpression: ['tag', 'quasi'],
        TemplateElement: [],
        TemplateLiteral: ['quasis', 'expressions'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handler', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body'],
        YieldExpression: ['argument']
    };

    Object.keys(SYNTAX).forEach(function (nodeType) {
        SYNTAX[nodeType] = { name: nodeType, children: SYNTAX[nodeType]};
    });

    astgen = {
        variable: function (name) {
            return {type: SYNTAX.Identifier.name, name: name};
        },
        stringLiteral: function (str) {
            return {type: SYNTAX.Literal.name, value: String(str)};
        },
        numericLiteral: function (num) {
            return {type: SYNTAX.Literal.name, value: Number(num)};
        },
        statement: function (contents) {
            return {
                type: SYNTAX.ExpressionStatement.name,
                expression: contents
            };
        },
        dot: function (obj, field) {
            return {
                type: SYNTAX.MemberExpression.name,
                computed: false,
                object: obj,
                property: field
            };
        },
        subscript: function (obj, sub) {
            return {
                type: SYNTAX.MemberExpression.name,
                computed: true,
                object: obj,
                property: sub
            };
        },
        postIncrement: function (obj) {
            return {
                type: SYNTAX.UpdateExpression.name,
                operator: '++',
                prefix: false,
                argument: obj
            };
        },
        sequence: function (one, two) {
            return {
                type: SYNTAX.SequenceExpression.name,
                expressions: [one, two]
            };
        },
        returnStatement: function (expr) {
            return {type: SYNTAX.ReturnStatement.name, argument: expr};
        }
    };

    function Walker(walkMap, preprocessor, scope, debug) {
        this.walkMap = walkMap;
        this.preprocessor = preprocessor;
        this.scope = scope;
        this.debug = debug;
        if (this.debug) {
            this.level = 0;
            this.seq = true;
        }
    }

    function defaultWalker(node, walker) {

        var type = node.type,
            preprocessor,
            postprocessor,
            children,
        // don't run generated nodes thru custom walks otherwise we will attempt to instrument the instrumentation code :)
            applyCustomWalker = !!node.loc || node.type === SYNTAX.Program.name,
            walkerFn = applyCustomWalker ? walker.walkMap[type] : null,
            i,
            j,
            walkFnIndex,
            childType,
            childNode,
            ret,
            childArray,
            childElement,
            pathElement,
            assignNode,
            isLast;

        if (!SYNTAX[type]) {
            console.error(node);
            console.error('Unsupported node type:' + type);
            return;
        }
        children = SYNTAX[type].children;
        /* istanbul ignore if: guard */
        if (node.walking) {
            throw new Error('Infinite regress: Custom walkers may NOT call walker.apply(node)');
        }
        node.walking = true;

        walker.apply(node, walker.preprocessor);
        preprocessor = node.preprocessor;
        if (preprocessor) {
            delete node.preprocessor;
            walker.apply(node, preprocessor);
        }

        if (isArray(walkerFn)) {
            for (walkFnIndex = 0; walkFnIndex < walkerFn.length; walkFnIndex += 1) {
                isLast = walkFnIndex === walkerFn.length - 1;
                walker.apply(node, walkerFn[walkFnIndex]);
            }
        } else if (walkerFn) {
            walker.apply(node, walkerFn);
        }

        if (node.skipSelf) {
            return;
        }

        for (i = 0; i < children.length; i += 1) {
            childType = children[i];
            childNode = node[childType];
            if (childNode && !childNode.skipWalk) {
                pathElement = {node: node, property: childType};
                if (isArray(childNode)) {
                    childArray = [];
                    for (j = 0; j < childNode.length; j += 1) {
                        childElement = childNode[j];
                        pathElement.index = j;
                        if (childElement) {
                            assignNode = walker.apply(childElement, null, pathElement);
                            if (isArray(assignNode.prepend)) {
                                pushAll(childArray, assignNode.prepend);
                                delete assignNode.prepend;
                            }
                        } else {
                            assignNode = undefined;
                        }
                        pushAll(childArray, assignNode);
                    }
                    node[childType] = childArray;
                } else {
                    assignNode = walker.apply(childNode, null, pathElement);
                    /*istanbul ignore if: paranoid check */
                    if (isArray(assignNode.prepend)) {
                        throw new Error('Internal error: attempt to prepend statements in disallowed (non-array) context');
                    } else {
                        node[childType] = assignNode;
                    }
                }
            }
        }

        postprocessor = node.postprocessor;
        if (postprocessor) {
            delete node.postprocessor;
            ret = walker.apply(node, postprocessor);
        }

        delete node.walking;
        return ret;
    }

    Walker.prototype = {
        startWalk: function (node) {
            this.path = [];
            this.apply(node);
        },

        apply: function (node, walkFn, pathElement) {
            var ret, i, seq, prefix;

            walkFn = walkFn || defaultWalker;
            if (this.debug) {
                this.seq += 1;
                this.level += 1;
                seq = this.seq;
                prefix = '';
                for (i = 0; i < this.level; i += 1) {
                    prefix += '    ';
                }
                console.log(prefix + 'Enter (' + seq + '):' + node.type);
            }
            if (pathElement) {
                this.path.push(pathElement);
            }
            ret = walkFn.call(this.scope, node, this);
            if (pathElement) {
                this.path.pop();
            }
            if (this.debug) {
                this.level -= 1;
                console.log(prefix + 'Return (' + seq + '):' + ( ret || node).type);
            }
            return ret || node;
        },

        ancestor: function (n) {
            return this.path.length > n - 1 ? this.path[this.path.length - n] : /* istanbul ignore next: guard */ null;
        },

        parent: function () {
            return this.ancestor(1);
        },

        isLabeled: function () {
            var el = this.parent();
            return el && el.node.type === SYNTAX.LabeledStatement.name;
        }
    };
    /**
     * mechanism to instrument code for coverage.
     * @class Instrumenter
     * @constructor
     * @param {Object} options Configuration options.
     * @param {String} [options.coverageVariable=`__coverage__`] the global variable name to use for
     *      tracking coverage.
     * @param {Boolean} [options.preserveComments=false] whether comments should be preserved in the output.
     * @param {Boolean} [options.compact=true] emit readable code when unset.
     * @param {Boolean} [options.esModules=false] whether the code to instrument contains uses es
     *      imports or exports.
     * @param {Boolean} [options.autoWrap=false] automatically wrap the source in
     *      an anonymous function before covering it. When set, code is wrapped in
     *      an anonymous function before it is parsed. This is done because
     *      some nodejs libraries have `return` statements outside of
     *      a function which is technically invalid Javascript and causes
     *      the parser to fail. This construct, however, works correctly in node
     *      since module loading is done in the context of an anonymous function.
     *      Note that the semantics of the code *returned* by the instrumenter does
     *      not change in any way. The function wrapper is "unwrapped" before the
     *      instrumented code is generated.
     * @param {Object} [options.codeGenerationOptions={}] an object that is directly passed to the `escodegen`
     *      library as configuration for code generation. The `compact` setting is not honored when this
     *      option is specified
     * @param {Function} [options.sourceMapUrlCallback=null] a callback function that is called
     *      with a source map URL found in the original source.
     * @param {Boolean} [options.debug=false] assist in debugging. Currently, the only effect of
     *      setting this option is a pretty-print of the coverage variable. Defaults to `false`
     * @param {Boolean} [options.walkDebug=false] assist in debugging of the AST walker used by this class.
     *
     */
    function Instrumenter(options) {
        var defaults = {
            debug: false,
            walkDebug: false,
            coverageVariable: '__coverage__',
            codeGenerationOptions: undefined,
            autoWrap: false,
            compact: true,
            preserveComments: false,
            esModules: false
        };
        options = options || {};
        Object.keys(defaults).forEach(function (k) {
            if (!options.hasOwnProperty(k)) {
                options[k] = defaults[k];
            }
        });

        if (options.esModules && options.autoWrap) {
            options.autoWrap = false;
            if (options.debug) {
                console.error('Setting autoWrap to false as required by esModules');
            }
        }

        this.opts = options;
        this.walker = new Walker({
            ArrowFunctionExpression: [this.arrowBlockConverter],
            ExpressionStatement: this.coverStatement,
            BreakStatement: this.coverStatement,
            ContinueStatement: this.coverStatement,
            DebuggerStatement: this.coverStatement,
            ReturnStatement: this.coverStatement,
            ThrowStatement: this.coverStatement,
            TryStatement: [this.paranoidHandlerCheck, this.coverStatement],
            VariableDeclaration: this.coverStatement,
            IfStatement: [this.ifBlockConverter, this.coverStatement, this.ifBranchInjector],
            ForStatement: [this.skipInit, this.loopBlockConverter, this.coverStatement],
            ForInStatement: [this.skipLeft, this.loopBlockConverter, this.coverStatement],
            ForOfStatement: [this.skipLeft, this.loopBlockConverter, this.coverStatement],
            WhileStatement: [this.loopBlockConverter, this.coverStatement],
            DoWhileStatement: [this.loopBlockConverter, this.coverStatement],
            SwitchStatement: [this.coverStatement, this.switchBranchInjector],
            SwitchCase: [this.switchCaseInjector],
            WithStatement: [this.withBlockConverter, this.coverStatement],
            FunctionDeclaration: [this.coverFunction, this.coverStatement],
            FunctionExpression: this.coverFunction,
            LabeledStatement: this.coverStatement,
            ConditionalExpression: this.conditionalBranchInjector,
            LogicalExpression: this.logicalExpressionBranchInjector,
            ObjectExpression: this.maybeAddType,
            MetaProperty: this.coverMetaProperty
        }, this.extractCurrentHint, this, this.opts.walkDebug);
    }

    Instrumenter.prototype = {
        /**
         * synchronous instrumentation method. Throws when illegal code is passed to it
         * @method instrumentSync
         * @param {String} code the code to be instrumented as a String
         * @param {String} filename Optional. The name of the file from which
         *  the code was read. A temporary filename is generated when not specified.
         *  Not specifying a filename is only useful for unit tests and demonstrations
         *  of this library.
         */
        instrumentSync: function (code, filename) {
            var program;

            //protect from users accidentally passing in a Buffer object instead
            if (typeof code !== 'string') {
                throw new Error('Code must be string');
            }

            if (code.charAt(0) === '#') { //shebang, 'comment' it out, won't affect syntax tree locations for things we care about
                code = '//' + code;
            }
            if (this.opts.autoWrap) {
                code = LEADER_WRAP + code + TRAILER_WRAP;
            }
            program = ESP.parse(code, {
                loc: true,
                range: true,
                tokens: this.opts.preserveComments,
                comment: true,
                attachComment: true,
                sourceType: this.opts.esModules ? 'module' : 'script'
            });
            if (this.opts.debug) {
                console.error('SYNTAX tree\n', JSON.stringify(program, null, 2));
            }
            if (this.opts.preserveComments) {
                program = ESPGEN.attachComments(program, program.comments, program.tokens);
            }
            if (this.opts.autoWrap) {
                program = {
                    type: SYNTAX.Program.name,
                    body: program.body[0].expression.callee.body.body,
                    comments: program.comments
                };
            }
            return this.instrumentASTSync(program, filename);
        },
        filterHintsAndExtractSourceMap: function (comments, filename) {
            var ret = [],
                i,
                comment,
                mapMatch,
                cb,
                groups;
            if (!(comments && isArray(comments))) {
                return ret;
            }
            for (i = 0; i < comments.length; i += 1) {
                comment = comments[i];
                /* istanbul ignore else: paranoid check */
                if (comment && comment.value && comment.range && isArray(comment.range)) {
                    groups = String(comment.value).match(COMMENT_RE);
                    if (groups) {
                        ret.push({
                            type: groups[1],
                            start: comment.range[0],
                            end: comment.range[1]
                        });
                    }
                }
                /* istanbul ignore else: paranoid check */
                if (comment && comment.value) {
                    mapMatch = SOURCE_MAP_RE.exec(comment.value);
                    if (mapMatch) {
                        cb = this.opts.sourceMapUrlCallback;
                        if (cb && typeof cb === 'function') {
                            cb(filename, mapMatch[1]);
                        }
                    }
                }
            }
            return ret;
        },
        extractCurrentHint: function (node) {
            if (!node.range) {
                return;
            }
            // ignore program nodes that start at the first
            // piece of code after leading comments; we want
            // to test against the inner node instead
            if (node.type === SYNTAX.Program.name) {
                return;
            }
            var i = this.currentState.lastHintPosition + 1,
                hints = this.currentState.hints,
                nodeStart = node.range[0],
                hint;
            this.currentState.currentHint = null;
            while (i < hints.length) {
                hint = hints[i];
                if (hint.end <= nodeStart) {
                    this.currentState.currentHint = hint;
                    this.currentState.lastHintPosition = i;
                    i += 1;
                } else {
                    break;
                }
            }
        },
        /**
         * synchronous instrumentation method that instruments an AST instead.
         * @method instrumentASTSync
         * @param {String} program the AST to be instrumented
         * @param {String} filename Optional. The name of the file from which
         *  the code was read. A temporary filename is generated when not specified.
         *  Not specifying a filename is only useful for unit tests and demonstrations
         *  of this library.
         */
        instrumentASTSync: function (program, filename) {
            var usingStrict = false,
                codegenOptions,
                generated,
                preamble,
                lineCount,
                i;
            filename = filename || String(new Date().getTime()) + '.js';
            this.sourceMap = null;
            this.fileCoverage = new SourceCoverage(filename);
            this.currentState = {
                trackerVar: generateTrackerVar(filename),
                hints: this.filterHintsAndExtractSourceMap(program.comments, filename),
                currentHint: null,
                lastHintPosition: -1,
                ignoring: 0
            };
            if (program.body && program.body.length > 0 && this.isUseStrictExpression(program.body[0])) {
                //nuke it
                program.body.shift();
                //and add it back at code generation time
                usingStrict = true;
            }
            this.walker.startWalk(program);
            codegenOptions = this.opts.codeGenerationOptions || {format: {compact: this.opts.compact}};
            codegenOptions.comment = this.opts.preserveComments;
            this.fileCoverage.freeze();

            generated = ESPGEN.generate(program, codegenOptions);
            preamble = this.getPreamble(usingStrict);

            if (generated.map && generated.code) {
                lineCount = preamble.split(/\r\n|\r|\n/).length;
                // offset all the generated line numbers by the number of lines in the preamble
                for (i = 0; i < generated.map._mappings._array.length; i += 1) {
                    generated.map._mappings._array[i].generatedLine += lineCount;
                }
                this.sourceMap = generated.map;
                generated = generated.code;
            }

            return preamble + '\n' + generated + '\n';
        },
        /**
         * Callback based instrumentation. Note that this still executes synchronously in the same process tick
         * and calls back immediately. It only provides the options for callback style error handling as
         * opposed to a `try-catch` style and nothing more. Implemented as a wrapper over `instrumentSync`
         *
         * @method instrument
         * @param {String} code the code to be instrumented as a String
         * @param {String} filename Optional. The name of the file from which
         *  the code was read. A temporary filename is generated when not specified.
         *  Not specifying a filename is only useful for unit tests and demonstrations
         *  of this library.
         * @param {Function(err, instrumentedCode)} callback - the callback function
         */
        instrument: function (code, filename, callback) {

            if (!callback && typeof filename === 'function') {
                callback = filename;
                filename = null;
            }
            try {
                callback(null, this.instrumentSync(code, filename));
            } catch (ex) {
                callback(ex);
            }
        },
        /**
         * returns the file coverage object for the code that was instrumented
         * just before calling this method. Note that this represents a
         * "zero-coverage" object which is not even representative of the code
         * being loaded in node or a browser (which would increase the statement
         * counts for mainline code).
         * @method lastFileCoverage
         * @return {Object} a "zero-coverage" file coverage object for the code last instrumented
         * by this instrumenter
         */
        lastFileCoverage: function () {
            return this.fileCoverage;
        },
        /**
         * returns the source map object for the code that was instrumented
         * just before calling this method.
         * @method lastSourceMap
         * @return {Object} a source map object for the code last instrumented
         * by this instrumenter
         */
        lastSourceMap: function () {
            return this.sourceMap;
        },
        fixColumnPositions: function (fc) {
            var offset = LEADER_WRAP.length,
                fixer = function (loc) {
                    if (loc.start.line === 1) {
                        loc.start.column -= offset;
                    }
                    if (loc.end.line === 1) {
                        loc.end.column -= offset;
                    }
                };
            fc.adjustLocations(fixer);
        },

        getPreamble: function (emitUseStrict) {
            var varName = this.opts.coverageVariable || '__coverage__',
                file = this.fileCoverage.path.replace(/\\/g, '\\\\'),
                tracker = this.currentState.trackerVar,
                cs,
                strictLine = emitUseStrict ? '"use strict";' : '',
                // return replacements using the function to ensure that the replacement is
                // treated like a dumb string and not as a string with RE replacement patterns
                replacer = function (s) {
                    return function () {
                        return s;
                    };
                },
                code;
            if (this.opts.autoWrap) {
                this.fixColumnPositions(this.fileCoverage);
            }
            cs = this.opts.debug ? JSON.stringify(this.fileCoverage, undefined, 4) : JSON.stringify(this.fileCoverage);
            code = [
                "%STRICT%",
                "var %VAR% = (Function('return this'))();",
                "if (!%VAR%.%GLOBAL%) { %VAR%.%GLOBAL% = {}; }",
                "%VAR% = %VAR%.%GLOBAL%;",
                "if (!(%VAR%['%FILE%'])) {",
                "   %VAR%['%FILE%'] = %OBJECT%;",
                "}",
                "%VAR% = %VAR%['%FILE%'];"
            ].join("\n")
                .replace(/%STRICT%/g, replacer(strictLine))
                .replace(/%VAR%/g, replacer(tracker))
                .replace(/%GLOBAL%/g, replacer(varName))
                .replace(/%FILE%/g, replacer(file))
                .replace(/%OBJECT%/g, replacer(cs));
            return code;
        },

        startIgnore: function () {
            this.currentState.ignoring += 1;
        },

        endIgnore: function () {
            this.currentState.ignoring -= 1;
        },

        convertToBlock: function (node) {
            if (!node) {
                return {type: 'BlockStatement', body: []};
            } else if (node.type === 'BlockStatement') {
                return node;
            } else {
                return {type: 'BlockStatement', body: [node]};
            }
        },

        arrowBlockConverter: function (node) {
            var retStatement;
            if (node.expression) { // turn expression nodes into a block with a return statement
                retStatement = astgen.returnStatement(node.body);
                // ensure the generated return statement is covered
                retStatement.loc = node.body.loc;
                node.body = this.convertToBlock(retStatement);
                node.expression = false;
            }
        },

        paranoidHandlerCheck: function (node) {
            // if someone is using an older esprima on the browser
            // convert handlers array to single handler attribute
            // containing its first element
            /* istanbul ignore next */
            if (!node.handler && node.handlers) {
                node.handler = node.handlers[0];
            }
        },

        ifBlockConverter: function (node) {
            node.consequent = this.convertToBlock(node.consequent);
            node.alternate = this.convertToBlock(node.alternate);
        },

        loopBlockConverter: function (node) {
            node.body = this.convertToBlock(node.body);
        },

        withBlockConverter: function (node) {
            node.body = this.convertToBlock(node.body);
        },

        statementName: function (location) {
            if (this.currentState.ignoring) {
                return null;
            }
            return this.fileCoverage.newStatement(location);
        },

        skipInit: function (node) {
            if (node.init) {
                node.init.skipWalk = true;
            }
        },

        skipLeft: function (node) {
            node.left.skipWalk = true;
        },

        isUseStrictExpression: function (node) {
            return node && node.type === SYNTAX.ExpressionStatement.name &&
                node.expression && node.expression.type === SYNTAX.Literal.name &&
                node.expression.value === 'use strict';
        },

        maybeSkipNode: function (node, type) {
            var alreadyIgnoring = !!this.currentState.ignoring,
                hint = this.currentState.currentHint,
                ignoreThis = !alreadyIgnoring && hint && hint.type === type;

            if (ignoreThis) {
                this.startIgnore();
                node.postprocessor = this.endIgnore;
                return true;
            }
            return false;
        },

        coverMetaProperty: function(node /* , walker */) {
            node.skipSelf = true;
        },

        coverStatement: function (node, walker) {
            var sName,
                shouldCover = true,
                incrStatementCount,
                grandParent;

            this.maybeSkipNode(node, 'next');

            if (this.isUseStrictExpression(node)) {
                grandParent = walker.ancestor(2);
                /* istanbul ignore else: difficult to test */
                if (grandParent) {
                    if ((grandParent.node.type === SYNTAX.FunctionExpression.name ||
                        grandParent.node.type === SYNTAX.FunctionDeclaration.name) &&
                        walker.parent().node.body[0] === node) {
                        return;
                    }
                }
            }

            if (node.type === SYNTAX.FunctionDeclaration.name) {
                shouldCover = false;
            }

            if (node.type === SYNTAX.VariableDeclaration.name) {
                shouldCover = false;
                node.declarations.forEach(function (child) {
                    if (child.init) {
                        shouldCover = true;
                    }
                });
            }

            if (shouldCover) {
                sName = this.statementName(node.loc);
                if (!sName) {
                    return;
                }
                incrStatementCount = astgen.statement(
                    astgen.postIncrement(
                        astgen.subscript(
                            astgen.dot(astgen.variable(this.currentState.trackerVar), astgen.variable('s')),
                            astgen.stringLiteral(sName)
                        )
                    )
                );
                this.splice(incrStatementCount, node, walker);
            }
        },

        splice: function (statements, node, walker) {
            var targetNode = walker.isLabeled() ? walker.parent().node : node;
            targetNode.prepend = targetNode.prepend || [];
            pushAll(targetNode.prepend, statements);
        },

        functionName: function (node, location, span) {
            if (this.currentState.ignoring) {
                return null;
            }
            return this.fileCoverage.newFunction(
                node.id ? node.id.name : '',
                location,
                span
            );
        },

        coverFunction: function (node) {
            var id,
                body = node.body,
                blockBody = body.body,
                popped;

            this.maybeSkipNode(node, 'next');

            id = this.functionName(node, {
                start: node.loc.start,
                end: {
                    line: node.body.loc.start.line,
                    column: node.body.loc.start.column
                }
            }, node.loc);

            if (!id) {
                return;
            }

            if (blockBody.length > 0 && this.isUseStrictExpression(blockBody[0])) {
                popped = blockBody.shift();
            }
            blockBody.unshift(
                astgen.statement(
                    astgen.postIncrement(
                        astgen.subscript(
                            astgen.dot(astgen.variable(this.currentState.trackerVar), astgen.variable('f')),
                            astgen.stringLiteral(id)
                        )
                    )
                )
            );
            if (popped) {
                blockBody.unshift(popped);
            }
        },

        branchName: function (type, node) {
            if (this.currentState.ignoring) {
                return null;
            }
            return this.fileCoverage.newBranch(type, node.loc);
        },

        branchIncrementExprAst: function (varName, branchIndex, down) {
            return astgen.postIncrement(
                astgen.subscript(
                    astgen.subscript(
                        astgen.dot(astgen.variable(this.currentState.trackerVar), astgen.variable('b')),
                        astgen.stringLiteral(varName)
                    ),
                    astgen.numericLiteral(branchIndex)
                ),
                down
            );
        },

        ifBranchInjector: function (node) {
            var alreadyIgnoring = !!this.currentState.ignoring,
                hint = this.currentState.currentHint,
                ignoreThen = !alreadyIgnoring && hint && hint.type === 'if',
                ignoreElse = !alreadyIgnoring && hint && hint.type === 'else',
                line = node.loc.start.line,
                col = node.loc.start.column,
                makeLoc = function () {
                    return {
                        start: {line: line, column: col},
                        end: {line: line, column: col}
                    };
                },
                bName,
                thenBody = node.consequent.body,
                elseBody = node.alternate.body,
                child,
                index;

            bName = this.branchName('if', node);
            if (!bName) {
                return;
            }

            if (ignoreThen) {
                child = node.consequent;
                child.preprocessor = this.startIgnore;
                child.postprocessor = this.endIgnore;
            } else {
                index = this.fileCoverage.addBranchPath(bName, makeLoc());
                thenBody.unshift(astgen.statement(this.branchIncrementExprAst(bName,index)));
            }

            if (ignoreElse) {
                child = node.alternate;
                child.preprocessor = this.startIgnore;
                child.postprocessor = this.endIgnore;
            } else {
                index = this.fileCoverage.addBranchPath(bName, makeLoc());
                elseBody.unshift(astgen.statement(this.branchIncrementExprAst(bName, index)));
            }
        },

        switchBranchInjector: function (node) {
            var cases = node.cases,
                bName,
                i;

            if (!(cases && cases.length > 0)) {
                return;
            }
            bName = this.branchName('switch', node);
            if (!bName) {
                return;
            }
            for (i = 0; i < cases.length; i += 1) {
                cases[i].branchLocation = bName;
            }
        },

        switchCaseInjector: function (node) {
            var bName = node.branchLocation,
                index;
            delete node.branchLocation;
            this.maybeSkipNode(node, 'next');
            if (!this.currentState.ignoring) {
                index = this.fileCoverage.addBranchPath(bName, node.loc);
                node.consequent.unshift(astgen.statement(this.branchIncrementExprAst(bName, index)));
            }
        },

        conditionalBranchInjector: function (node) {
            var bName = this.branchName('cond-expr', node);
            if (!bName) {
                return;
            }
            node.consequent.preprocessor = this.maybeAddPath(bName);
            node.alternate.preprocessor = this.maybeAddPath(bName);
        },

        maybeAddPath: function(bName) {
            return function (node) {
                var alreadyIgnoring = !!this.currentState.ignoring,
                    hint = this.currentState.currentHint,
                    ignoreThis = !alreadyIgnoring && hint && hint.type === 'next',
                    index,
                    ast;

                if (ignoreThis) {
                    this.startIgnore();
                    node.postprocessor = this.endIgnore;
                }
                if (!(ignoreThis || alreadyIgnoring)) {
                    index = this.fileCoverage.addBranchPath(bName, node.loc);
                    ast = this.branchIncrementExprAst(bName, index);
                    node.postprocessor = function (node) {
                        return astgen.sequence(ast, node);
                    };
                }
            };
        },
        logicalExpressionBranchInjector: function (node, walker) {
            var parent = walker.parent(),
                leaves = [],
                bName,
                tuple,
                i;

            this.maybeSkipNode(node, 'next');

            if (parent && parent.node.type === SYNTAX.LogicalExpression.name) {
                //already covered
                return;
            }

            this.findLeaves(node, leaves);
            bName = this.branchName('binary-expr', node);
            if (!bName) {
                return;
            }
            for (i = 0; i < leaves.length; i += 1) {
                tuple = leaves[i];
                tuple.node.preprocessor = this.maybeAddPath(bName);
            }
        },

        findLeaves: function (node, accumulator, parent, property) {
            if (node.type === SYNTAX.LogicalExpression.name) {
                this.findLeaves(node.left, accumulator, node, 'left');
                this.findLeaves(node.right, accumulator, node, 'right');
            } else {
                accumulator.push({
                    node: node,
                    parent: parent,
                    property: property
                });
            }
        },
        maybeAddType: function (node) {
            var props = node.properties,
                i,
                child;
            for (i = 0; i < props.length; i += 1) {
                child = props[i];
                if (!child.type) {
                    child.type = SYNTAX.Property.name;
                }
            }
        }
    };

    return Instrumenter;
};

