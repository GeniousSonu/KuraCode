import { describe, expect, it } from 'vitest';
import {
  cleanCode,
  detectLanguage,
  stripLineNumbers,
  stripPrompts,
} from '../src/shared/cleaner';

describe('stripLineNumbers (CLEAN-1)', () => {
  it('strips gutter line numbers when the majority of lines have them', () => {
    const input = '1 function foo() {\n2 return 1;\n3 }\n';
    expect(stripLineNumbers(input)).toBe('function foo() {\nreturn 1;\n}\n');
  });

  it('leaves code untouched when most lines have no gutters', () => {
    const input = 'const x = 1;\nreturn x;\n';
    expect(stripLineNumbers(input)).toBe(input);
  });
});

describe('stripPrompts (CLEAN-2)', () => {
  it('removes a $ shell prompt', () => {
    expect(stripPrompts('$ npm install')).toBe('npm install');
  });

  it('removes a Windows PowerShell prompt', () => {
    expect(stripPrompts('PS C:\\Users\\me> dir')).toBe('dir');
  });
});

describe('cleanCode', () => {
  it('normalizes CRLF, strips prompts and trailing blank lines', () => {
    const raw = '  function a() {\r\n    return 1;\r\n  }\r\n\r\n\r\n';
    expect(cleanCode(raw)).toBe('  function a() {\n    return 1;\n  }');
  });

  it('keeps prompts when keepPrompts is requested', () => {
    expect(cleanCode('$ echo hi', { keepPrompts: true })).toBe('$ echo hi');
  });
});

describe('detectLanguage (CLEAN-4)', () => {
  it('falls back to the default language with no hints', () => {
    expect(detectLanguage(null, 'some plain text')).toBe('text');
  });

  it('detects python from a text hint', () => {
    expect(detectLanguage(null, 'python example')).toBe('python');
  });

  it('detects typescript from a text hint', () => {
    expect(detectLanguage(null, 'Use typescript here')).toBe('typescript');
  });
});
