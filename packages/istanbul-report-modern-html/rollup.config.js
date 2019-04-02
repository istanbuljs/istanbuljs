import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

module.exports = {
    input: 'src/index.js',
    output: {
        file: 'assets/bundle.js',
        format: 'iife'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        resolve(),
        commonjs(),
        // use fast minify mode https://github.com/terser-js/terser#terser-fast-minify-mode
        terser({ compress: false, mangle: true })
    ]
};
