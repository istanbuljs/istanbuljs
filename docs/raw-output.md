# Coverage Format for opts.coverageVariable or coverage-final.json

This file describes the output raw output format of the IstanbulJS libraries.

## Format

-   `output` **[Object][1]** root.
    -   `output.<absolute path>` **[Object][1]** coverage object for a file.
        -   `<absolute path>.path` **[string][2]** the absolute path of the covered object.
        -   `<absolute path>.statementMap` **[Object][1]** the object that maps statements to code.
            -   `statementMap.<index>` **[Object][1]** the statement's location object; 0-based.
                -   `<index>.start` **[Object][1]** the statement's start location object.
                    -   `start.line` **[number][3]** the statement's start location line number.
                    -   `start.column` **[number][3]** the statement's start location column number.
                -   `<index>.end` **[Object][1]** the statement's end location object.
                    -   `end.line` **[number][3]** the statement's end location line number.
                    -   `end.column` **[number][3]** the statement's end location column number.
        -   `<absolute path>.fnMap` **[Object][1]** the object that maps functions to code.
            -   `fnMap.<index>` **[Object][1]** the function's map object; 0-based.
                -   `<index>.name` **[string][2]** the function's name.
                -   `<index>.line` **[number][3]** the function declaration start location line number.
                -   `<index>.decl` **[Object][1]** the function declaration location object.
                    -   `decl.start` **[Object][1]** the function declaration start location object.
                        -   `start.line` **[number][3]** the function declaration start location line number.
                        -   `start.column` **[number][3]** the function declaration start location column number.
                    -   `decl.end` **[Object][1]** the function declaration end location object.
                        -   `end.line` **[number][3]** the function declaration end location line number.
                        -   `end.column` **[number][3]** the function declaration end location column number.
                -   `<index>.loc` **[Object][1]** the function body location object.
                    -   `loc.start` **[Object][1]** the function body start location object.
                        -   `start.line` **[number][3]** the function body start location line number.
                        -   `start.column` **[number][3]** the function body start location column number.
                    -   `loc.end` **[Object][1]** the function body end location object.
                        -   `end.line` **[number][3]** the function body end location line number.
                        -   `end.column` **[number][3]** the function body end location column number.
        -   `<absolute path>.branchMap` **[Object][1]** the object that maps branches to code.
            -   `branchMap.<index>` **[Object][1]** the branch map object; 0-based.
                -   `<index>.line` **[number][3]** the branch declaration start location line number.
                -   `<index>.type` **[string][2]** the branch type; see [branch types][5].
                -   `<index>.loc` **[Object][1]** the branch location object.
                    -   `loc.start` **[Object][1]** the branch start location object.
                        -   `start.line` **[number][3]** the branch start location line number.
                        -   `start.column` **[number][3]** the branch start location column number.
                    -   `loc.end` **[Object][1]** the branch end location object.
                        -   `end.line` **[number][3]** the branch end location line number.
                        -   `end.column` **[number][3]** the branch end location column number.
                -   `<index>.locations` **[Array][4]** the location objects for component branches or binary expressions.
                    -   `locations[index]` **[Object][1]** the location object for the component branch or binary expression.
                        -   `locations[index].start` **[Object][1]** the branch component start location object. (`{}` for if branch without else)
                            -   `start.line` **[number][3]** the branch component start location line number.
                            -   `start.column` **[number][3]** the branch component start location column number.
                        -   `locations[index].end` **[Object][1]** the branch component end location object. (`{}` for if branch without else)
                            -   `end.line` **[number][3]** the branch component end location line number.
                            -   `end.column` **[number][3]** the branch component end location column number.
        -   `<absolute path>.s` **[Object][1]** the object that reports the aggregated statement-level counters.
            -   `s.<index>` **[number][3]** The aggregated statement-level counter; 0-based.
        -   `<absolute path>.f` **[Object][1]** the object that reports the aggregated function-level counters.
            -   `f.<index>` **[number][3]** The aggregated function-level counter; 0-based.
        -   `<absolute path>.b` **[Object][1]** the object that reports the aggregated branch-level counters.
            -   `b.<index>` **[Array][4]** The array for branch component counters.
                -   `<index>[component index]` **[number][3]** The aggregated branch component counter.
        -   `<absolute path>.bT` **[Object][1]** the object that reports the aggregated branch-level, evaluated logical truthiness counters. Only evaluated with the `reportLogic=true` option. (optional, default `undefined`)
            -   `bT.<index>` **[Array][4]** The array for branch component truthiness counters.
                -   `<index>[component index]` **[number][3]** The aggregated branch component counter.
        -   `<absolute path>._coverageSchema` **[string][2]** the coverage schema.
        -   `<absolute path>.hash` **[string][2]** the hash.
        -   `<absolute path>.contentHash` **[string][2]** the hash of the files. (only in the .json report)

## Branch Types

- `if`  an if statement; can also be `else if`.
- `binary-expr`  a logical expression with a binary operand. e.g.: `x && y`
- `cond-expr`  a ternary expression. e.g.: `x ? y : z`
- `switch`  a switch statement.
- `default-arg`  assignment logic. e.g.: `x &= y`

[1]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[2]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[5]: #branch-types
