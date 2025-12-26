import { test } from 'node:test';
import assert from 'node:assert';
import { validateAbcNotation, AbcToPdfSchema } from '../src/index.js';

test('validateAbcNotation - valid notation', () => {
  const validAbc = 'X:1\nT:Test\nM:4/4\nK:C\nC D E F |';
  assert.doesNotThrow(() => validateAbcNotation(validAbc));
});

test('validateAbcNotation - empty string throws error', () => {
  assert.throws(
    () => validateAbcNotation(''),
    { message: 'ABC notation must be a non-empty string' }
  );
});

test('validateAbcNotation - null throws error', () => {
  assert.throws(
    () => validateAbcNotation(null),
    { message: 'ABC notation must be a non-empty string' }
  );
});

test('validateAbcNotation - script tag throws error', () => {
  const maliciousAbc = '<script>alert("xss")</script>X:1\nK:C\nC D E F';
  assert.throws(
    () => validateAbcNotation(maliciousAbc),
    { message: 'ABC notation contains potentially unsafe content' }
  );
});

test('validateAbcNotation - javascript protocol throws error', () => {
  const maliciousAbc = 'javascript:alert(1)';
  assert.throws(
    () => validateAbcNotation(maliciousAbc),
    { message: 'ABC notation contains potentially unsafe content' }
  );
});

test('validateAbcNotation - iframe tag throws error', () => {
  const maliciousAbc = '<iframe src="evil.com"></iframe>';
  assert.throws(
    () => validateAbcNotation(maliciousAbc),
    { message: 'ABC notation contains potentially unsafe content' }
  );
});

test('AbcToPdfSchema - valid input', () => {
  const validInput = {
    abc_notation: 'X:1\nT:Test\nM:4/4\nK:C\nC D E F |',
    title: 'Test Song',
    composer: 'Test Composer'
  };
  
  const result = AbcToPdfSchema.parse(validInput);
  assert.strictEqual(result.abc_notation, validInput.abc_notation);
  assert.strictEqual(result.title, validInput.title);
  assert.strictEqual(result.composer, validInput.composer);
});

test('AbcToPdfSchema - minimal valid input', () => {
  const validInput = {
    abc_notation: 'X:1\nK:C\nC D E F |'
  };
  
  const result = AbcToPdfSchema.parse(validInput);
  assert.strictEqual(result.abc_notation, validInput.abc_notation);
  assert.strictEqual(result.title, undefined);
  assert.strictEqual(result.composer, undefined);
});

test('AbcToPdfSchema - empty abc_notation throws error', () => {
  const invalidInput = {
    abc_notation: ''
  };
  
  assert.throws(
    () => AbcToPdfSchema.parse(invalidInput),
    (error) => {
      assert(error.message.includes('ABC notation cannot be empty'));
      return true;
    }
  );
});

test('AbcToPdfSchema - missing abc_notation throws error', () => {
  const invalidInput = {
    title: 'Test'
  };
  
  assert.throws(
    () => AbcToPdfSchema.parse(invalidInput)
  );
});

test('AbcToPdfSchema - optional fields', () => {
  const validInput = {
    abc_notation: 'X:1\nK:C\nC D E F |',
    title: 'Only Title'
  };
  
  const result = AbcToPdfSchema.parse(validInput);
  assert.strictEqual(result.title, 'Only Title');
  assert.strictEqual(result.composer, undefined);
});
