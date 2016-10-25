import { MAGIC_KEY, MAGIC_VALUE } from './constants';
import { parse } from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';

export default function readInitialCoverage (code) {
    if (typeof code !== 'string') {
        throw new Error('Code must be a string');
    }

    // Parse as leniently as possible
    const ast = parse(code, {
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        allowSuperOutsideMethod: true,
        sourceType: "script", // I think ?
        plugins: ["*"]
    });

    let covScope;
    traverse(ast, {
        ObjectProperty: function (path) {
            const { node } = path;
            if (!node.computed &&
                t.isIdentifier(node.key) &&
                node.key.name === MAGIC_KEY)
            {
                const magicValue = path.get('value').evaluate();
                if (!magicValue.confident || magicValue.value !== MAGIC_VALUE) {
                    return;
                }
                covScope = path.scope.getFunctionParent();
                path.stop();
            }
        }
    });

    if (!covScope) {
        return null;
    }

    const result = {};

    for (const key of ['path', 'hash', 'gcv', 'coverageData']) {
        const binding = covScope.getOwnBinding(key);
        if (!binding) {
            return null;
        }
        const valuePath = binding.path.get('init');
        const value = valuePath.evaluate();
        if (!value.confident) {
            return null;
        }
        result[key] = value.value;
    }

    delete result.coverageData[MAGIC_KEY];
    
    return result;
}
