/* global describe, it, context */

const { spawnSync } = require('child_process');
const path = require('path');
const exclude = require('../');

require('chai').should();

describe('testExclude', function() {
    it('should exclude the node_modules folder by default', function() {
        exclude()
            .shouldInstrument('./banana/node_modules/cat.js')
            .should.equal(false);
        exclude()
            .shouldInstrument('node_modules/cat.js')
            .should.equal(false);
    });

    it('ignores ./', function() {
        exclude()
            .shouldInstrument('./test.js')
            .should.equal(false);
        exclude()
            .shouldInstrument('./foo.test.js')
            .should.equal(false);
    });

    it('matches files in root with **/', function() {
        exclude()
            .shouldInstrument('__tests__/**')
            .should.equal(false);
    });

    it('does not instrument files outside cwd', function() {
        exclude({ include: ['../foo.js'] })
            .shouldInstrument('../foo.js')
            .should.equal(false);
    });

    it('can instrument files outside cwd if relativePath=false', function() {
        exclude({
            include: ['../foo.js'],
            relativePath: false
        })
            .shouldInstrument('../foo.js')
            .should.equal(true);
    });

    it('does not instrument files in the coverage folder by default', function() {
        exclude()
            .shouldInstrument('coverage/foo.js')
            .should.equal(false);
    });

    it('applies exclude rule ahead of include rule', function() {
        const e = exclude({
            include: ['test.js', 'foo.js'],
            exclude: ['test.js']
        });
        e.shouldInstrument('test.js').should.equal(false);
        e.shouldInstrument('foo.js').should.equal(true);
        e.shouldInstrument('banana.js').should.equal(false);
    });

    it('should handle gitignore-style excludes', function() {
        const e = exclude({
            exclude: ['dist']
        });

        e.shouldInstrument('dist/foo.js').should.equal(false);
        e.shouldInstrument('dist/foo/bar.js').should.equal(false);
        e.shouldInstrument('src/foo.js').should.equal(true);
    });

    it('should handle gitignore-style includes', function() {
        const e = exclude({
            include: ['src']
        });

        e.shouldInstrument('src/foo.test.js').should.equal(false);
        e.shouldInstrument('src/foo.js').should.equal(true);
        e.shouldInstrument('src/foo/bar.js').should.equal(true);
    });

    it("handles folder '.' in path", function() {
        const e = exclude();
        e.shouldInstrument(
            'test/fixtures/basic/.next/dist/pages/async-props.js'
        ).should.equal(false);
    });

    it('excludes node_modules folder, even when empty exclude group is provided', function() {
        const e = exclude({
            exclude: []
        });

        e.shouldInstrument('./banana/node_modules/cat.js').should.equal(false);
        e.shouldInstrument('node_modules/some/module/to/cover.js').should.equal(
            false
        );
        e.shouldInstrument('__tests__/a-test.js').should.equal(true);
        e.shouldInstrument('src/a.test.js').should.equal(true);
        e.shouldInstrument('src/foo.js').should.equal(true);
    });

    it('allows node_modules folder to be included, if !node_modules is explicitly provided', function() {
        const e = exclude({
            exclude: ['!**/node_modules/**']
        });

        e.shouldInstrument('./banana/node_modules/cat.js').should.equal(true);
        e.shouldInstrument('node_modules/some/module/to/cover.js').should.equal(
            true
        );
        e.shouldInstrument('__tests__/a-test.js').should.equal(true);
        e.shouldInstrument('src/a.test.js').should.equal(true);
        e.shouldInstrument('src/foo.js').should.equal(true);
    });

    it('allows specific node_modules folder to be included, if !node_modules is explicitly provided', function() {
        const e = exclude({
            exclude: ['!**/node_modules/some/module/to/cover.js']
        });

        e.shouldInstrument('./banana/node_modules/cat.js').should.equal(false);
        e.shouldInstrument('node_modules/some/module/to/cover.js').should.equal(
            true
        );
        e.shouldInstrument('__tests__/a-test.js').should.equal(true);
        e.shouldInstrument('src/a.test.js').should.equal(true);
        e.shouldInstrument('src/foo.js').should.equal(true);
    });

    it('allows node_modules default exclusion glob to be turned off, if excludeNodeModules === false', function() {
        const e = exclude({
            excludeNodeModules: false,
            exclude: ['node_modules/**', '**/__test__/**']
        });

        e.shouldInstrument('node_modules/cat.js').should.equal(false);
        e.shouldInstrument('./banana/node_modules/cat.js').should.equal(true);
        e.shouldInstrument(
            './banana/node_modules/__test__/cat.test.js'
        ).should.equal(false);
        e.shouldInstrument(
            './banana/node_modules/__test__/cat-test.js'
        ).should.equal(false);
        e.shouldInstrument(
            './banana/node_modules/__test__/cat.js'
        ).should.equal(false);
    });

    it('allows negated exclude patterns', function() {
        const e = exclude({
            exclude: ['foo/**', '!foo/bar.js']
        });

        e.shouldInstrument('./foo/fizz.js').should.equal(false);
        e.shouldInstrument('./foo/bar.js').should.equal(true);
    });

    it('allows negated include patterns', function() {
        const e = exclude({
            include: ['batman/**', '!batman/robin.js']
        });

        e.shouldInstrument('./batman/joker.js').should.equal(true);
        e.shouldInstrument('./batman/robin.js').should.equal(false);
    });

    it('negated exclude patterns only works for files that are covered by the `include` pattern', function() {
        const e = exclude({
            include: ['index.js'],
            exclude: ['!index2.js']
        });

        e.shouldInstrument('index.js').should.equal(true);
        e.shouldInstrument('index2.js').should.equal(false);
    });

    it('handles extension option', function() {
        const js = exclude({
            extension: '.js'
        });

        js.shouldInstrument('file.js').should.equal(true);
        js.shouldInstrument('package.json').should.equal(false);

        const any = exclude();
        any.shouldInstrument('file.js').should.equal(true);
        any.shouldInstrument('package.json').should.equal(true);

        const multi = exclude({
            extension: ['.js', '.json']
        });
        multi.shouldInstrument('file.js').should.equal(true);
        multi.shouldInstrument('file.png').should.equal(false);
        multi.shouldInstrument('package.json').should.equal(true);
    });

    it('negated exclude patterns unrelated to node_modules do not affect default node_modules exclude behavior', function() {
        const e = exclude({
            exclude: ['!foo/**']
        });

        e.shouldInstrument('node_modules/cat.js').should.equal(false);
    });

    it('exports defaultExclude', function() {
        exclude.defaultExclude.should.deep.equal([
            'coverage/**',
            'packages/*/test/**',
            'test/**',
            'test{,-*}.js',
            '**/*{.,-}test.js',
            '**/__tests__/**',
            '**/node_modules/**',
            '**/babel.config.js'
        ]);
    });

    describe('pkgConf', function() {
        it('should load exclude rules from config key', function() {
            const e = exclude({
                configPath: './test/fixtures/exclude',
                configKey: 'a'
            });

            e.shouldInstrument('foo.js').should.equal(true);
            e.shouldInstrument('batman.js').should.equal(false);
            e.configFound.should.equal(true);
        });

        it('should load exclude rules from config key using process location', function() {
            /* This needs to be a separate process so we resolve
             * the correct package.json instead of trying to look
             * at the package.json provided by mocha */
            spawnSync(process.argv0, [
                path.resolve(__dirname, 'fixtures/subprocess/bin/subprocess.js')
            ]).status.should.equal(0);
        });

        it('should load include rules from config key', function() {
            const e = exclude({
                configPath: './test/fixtures/include',
                configKey: 'b'
            });

            e.shouldInstrument('foo.js').should.equal(false);
            e.shouldInstrument('batman.js').should.equal(true);
            e.configFound.should.equal(true);
        });

        it('should only instrument files that are included in subdirs', function() {
            const e = exclude({
                configPath: './test/fixtures/include-src-only',
                configKey: 'c'
            });
            e.shouldInstrument('bar/baz.js').should.equal(false);
            e.shouldInstrument('bad/file.js').should.equal(false);
            e.shouldInstrument('foo.js').should.equal(false);

            e.shouldInstrument('src/app.test.js').should.equal(false);
            e.shouldInstrument('src/app.js').should.equal(true);
        });

        it('should respect defaultExcludes if no config is given', function() {
            const e = exclude({
                configPath: './test/fixtures/defaults',
                configKey: 'd'
            });

            e.shouldInstrument('test.js').should.equal(false);
            e.shouldInstrument('src/app.test.js').should.equal(false);
            e.shouldInstrument('src/app-test.js').should.equal(false);

            e.shouldInstrument(
                'packages/package-name/test/test-utils.js'
            ).should.equal(false);

            e.shouldInstrument('bar/baz.js').should.equal(true);
            e.shouldInstrument('bad/file.js').should.equal(true);
            e.shouldInstrument('foo.js').should.equal(true);
            e.shouldInstrument('index.js').should.equal(true);
        });

        it('should not throw if a key is missing', function() {
            var e = exclude({
                configPath: './test/fixtures/include',
                configKey: 'c'
            });
            e.configFound.should.equal(false);
        });

        context('when given an object', function() {
            it('should use the defaultExcludes if the object is empty', function() {
                const e = exclude({
                    configPath: './test/fixtures/exclude-empty-object',
                    configKey: 'e'
                });

                e.shouldInstrument('test.js').should.equal(false);
                e.shouldInstrument('src/app.test.js').should.equal(false);

                e.shouldInstrument('bar/baz.js').should.equal(true);
                e.shouldInstrument('bad/file.js').should.equal(true);
                e.shouldInstrument('foo.js').should.equal(true);
                e.shouldInstrument('index.js').should.equal(true);
            });

            it('should use the defaultExcludes if the object is not empty', function() {
                const e = exclude({
                    configPath: './test/fixtures/exclude-object',
                    configKey: 'e'
                });

                e.shouldInstrument('test.js').should.equal(false);
                e.shouldInstrument('src/app.test.js').should.equal(false);
                e.shouldInstrument('src/app-test.js').should.equal(false);

                e.shouldInstrument(
                    'packages/package-name/test/test-utils.js'
                ).should.equal(false);

                e.shouldInstrument('bar/baz.js').should.equal(true);
                e.shouldInstrument('bad/file.js').should.equal(true);
                e.shouldInstrument('foo.js').should.equal(true);
                e.shouldInstrument('index.js').should.equal(true);
            });
        });
    });

    describe('globSync', function() {
        const cwd = path.resolve(__dirname, 'fixtures/glob');
        const extension = '.js';

        it('should exclude the node_modules folder by default', function() {
            exclude({ cwd, extension })
                .globSync()
                .sort()
                .should.deep.equal(['file1.js', 'file2.js']);

            exclude({ cwd, extension: ['.json'] })
                .globSync()
                .sort()
                .should.deep.equal(['package.json']);

            exclude({ cwd, extension: [] })
                .globSync()
                .sort()
                .should.deep.equal([
                    '.nycrc',
                    'file1.js',
                    'file2.js',
                    'package.json'
                ]);

            exclude({ cwd, extension: ['.js', '.json'] })
                .globSync()
                .sort()
                .should.deep.equal(['file1.js', 'file2.js', 'package.json']);

            exclude({ cwd: path.join(process.cwd(), 'test') })
                .globSync(cwd)
                .sort()
                .should.deep.equal([
                    '.nycrc',
                    'file1.js',
                    'file2.js',
                    'package.json'
                ]);
        });

        it('applies exclude rule ahead of include rule', function() {
            const e = exclude({
                cwd,
                extension,
                include: ['file1.js', 'file2.js'],
                exclude: ['file1.js']
            });

            e.globSync()
                .sort()
                .should.deep.equal(['file2.js']);
        });

        it('allows node_modules folder to be included, if !node_modules is explicitly provided', function() {
            const e = exclude({
                cwd,
                extension,
                exclude: ['!node_modules']
            });

            e.globSync()
                .sort()
                .should.deep.equal([
                    'file1.js',
                    'file2.js',
                    'node_modules/something/index.js',
                    'node_modules/something/other.js'
                ]);
        });

        it('allows specific node_modules folder to be included, if !node_modules is explicitly provided', function() {
            const e = exclude({
                cwd,
                extension,
                exclude: ['!node_modules/something/other.js']
            });

            e.globSync()
                .sort()
                .should.deep.equal([
                    'file1.js',
                    'file2.js',
                    'node_modules/something/other.js'
                ]);
        });

        it('allows negated exclude patterns', function() {
            const e = exclude({
                cwd,
                extension,
                exclude: ['*.js', '!file1.js']
            });

            e.globSync()
                .sort()
                .should.deep.equal(['file1.js']);
        });

        it('allows negated include patterns', function() {
            const e = exclude({
                cwd,
                include: ['*.js', '!file2.js']
            });

            e.globSync()
                .sort()
                .should.deep.equal(['file1.js']);
        });
    });

    // see: https://github.com/istanbuljs/babel-plugin-istanbul/issues/71
    it('allows exclude/include rule to be a string', function() {
        const e = exclude({
            exclude: 'src/**/*.spec.js',
            include: 'src/**'
        });
        e.shouldInstrument('src/batman/robin/foo.spec.js').should.equal(false);
        e.shouldInstrument('src/batman/robin/foo.js').should.equal(true);
    });
});
