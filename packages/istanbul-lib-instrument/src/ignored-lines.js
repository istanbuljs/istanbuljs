const IGNORE_LINES_PATTERN = /\s*istanbul\s+ignore\s+(start|stop)/;
const EOL_PATTERN = /\r?\n/g;

/**
 * Parse ignore start/stop hints from **text file** based on regular expressions
 * - Does not understand what a comment is in Javascript (or JSX, Vue, Svelte)
 * - Parses source code (JS, TS, Vue, Svelte, anything) based on text search by
 *   matching for `/* istanbul ignore start *\/` pattern - not by looking for real comments
 *
 * ```js
 * /* istanbul ignore start *\/
 * <!-- /* istanbul ignore start *\/ -->
 * <SomeFrameworkComment content="/* istanbul ignore start *\/">
 * ```
 */
function getIgnoredLines(text) {
    if (!text) {
        return new Set();
    }

    const ranges = [];
    let lineNumber = 0;

    for (const line of text.split(EOL_PATTERN)) {
        lineNumber++;

        const match = line.match(IGNORE_LINES_PATTERN);
        if (match) {
            const type = match[1];

            if (type === 'stop') {
                const previous = ranges[ranges.length - 1];

                // Ignore whole "ignore stop" if no previous start was found
                if (previous && previous.stop === Infinity) {
                    previous.stop = lineNumber;
                }

                continue;
            }

            ranges.push({ start: lineNumber, stop: Infinity });
        }
    }

    const ignoredLines = new Set();

    for (const range of ranges) {
        for (let line = range.start; line <= range.stop; line++) {
            ignoredLines.add(line);

            if (line >= lineNumber) {
                break;
            }
        }
    }

    return ignoredLines;
}

module.exports = { getIgnoredLines };
