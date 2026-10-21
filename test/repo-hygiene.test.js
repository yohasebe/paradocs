/**
 * Tests that tracked files carry no machine-specific absolute paths
 *
 * @jest-environment node
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCAL_PATH = /\/(?:Users|home)\/[^/\s'"`]+\//;

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    .filter(f => f && fs.existsSync(path.join(ROOT, f)));
}

describe('Repository hygiene', () => {
  test('pattern detects a home-directory path', () => {
    // Built by concatenation so this file does not match its own check
    expect(LOCAL_PATH.test("const DIR = '/" + "Users/someone/project/img';")).toBe(true);
    expect(LOCAL_PATH.test("const DIR = '/" + "home/someone/project/img';")).toBe(true);
    expect(LOCAL_PATH.test("const DIR = fileURLToPath(new URL('../img', import.meta.url));")).toBe(false);
  });

  test('no tracked file contains a home-directory path', () => {
    const offenders = trackedFiles().filter(f => {
      const buf = fs.readFileSync(path.join(ROOT, f));
      if (buf.includes(0)) return false;  // skip binary files
      return LOCAL_PATH.test(buf.toString('utf8'));
    });
    expect(offenders).toEqual([]);
  });
});
