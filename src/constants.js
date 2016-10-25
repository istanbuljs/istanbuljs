import { major } from 'semver';
import { name, version } from '../package.json';
import {createHash} from 'crypto';

// function to use for creating hashes
export const SHA = 'sha1';
// name of coverage data magic key
export const MAGIC_KEY = '_coverageSchema';
// name of coverage data magic value
export const MAGIC_VALUE = createHash(SHA).update(name + '@' + major(version)).digest('hex');
