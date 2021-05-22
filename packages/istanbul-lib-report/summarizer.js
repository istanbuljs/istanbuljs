'use strict';

const Path = require('./lib/path');
const { ReportNode, ReportTree, Util } = require('./lib/summarizer-core');

/**
 * @module Summarizer
 *
 * A summarizer is a utility function that takes a list of files with code coverage and organizes
 * it into a ReportTree object. How the nodes are organized determines how the reporter using the
 * summarizer will structure its output.
 *
 * There are 3 built-in summarizers:
 *
 *  - `flat` produces a single root node containing all covered files, with no intermediate nodes
 *    for folders.
 *  - `pkg` collects covered files into their closest folders, collapsing folders that don't contain
 *    any source files. Each intermediate node represents a folder containing source files.
 *  - `nested` acts like a typical file explorer view, with intermediate nodes representing folders
 *    (including folders that only contain other folders).
 *
 * Some (but not all) reporters allow you to pass a `summarizer:` option to control which summarizer
 * function is used when creating the coverage report.
 *
 * In addition to these built-in summarizers, you can create your own summarizer function and pass
 * it to a reporter. The summarizer function must return a `ReportTree` object, and it accepts
 * an initial list of file entries (containing file coverage data and `Path` object). Look at the
 * implementation of the existing summarizers in `lib/summarizer-core.js` for examples.
 */

module.exports = {
    /**
     * A report tree represents a collection of nodes, where each node represents an individual file
     * with code coverage or a collection of files (usually a folder).
     */
    ReportTree,

    /**
     * Each report node contains a path and coverage information, along with references to its parent
     * node and any child nodes.
     */
    ReportNode,

    /**
     * The Path utility class represents file paths as an array of path segments, and is used extensively
     * in the ReportTree and ReportNode classes.
     */
    Path,

    /**
     * A collection of utility functions useful for collapsing, searching, and organizing report nodes while
     * building a report tree.
     */
    Util
};
