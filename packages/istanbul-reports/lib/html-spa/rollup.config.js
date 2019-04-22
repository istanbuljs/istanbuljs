import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';

module.exports = {
    input: 'lib/html-spa/src/index.js',
    output: {
        file: 'lib/html-spa/assets/bundle.js',
        format: 'iife'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        resolve(),
        commonjs({
            namedExports: {
                'react/index.js': [
                    'createElement',
                    'Fragment',
                    'useState',
                    'useMemo',
                    'useEffect'
                ],
                'react-dom/index.js': ['render', 'unstable_batchedUpdates']
            }
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        // use fast minify mode https://github.com/terser-js/terser#terser-fast-minify-mode
        terser({
            compress: false,
            mangle: true,
            output: {
                preamble: '/* eslint-disable */\n'
            }
        })
    ]
};
