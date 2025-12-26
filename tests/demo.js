#!/usr/bin/env node

/**
 * Comprehensive demonstration of the Partitura MCP Server
 * This script tests all major features and generates sample PDFs
 */

import { abcToPdf, validateAbcNotation, pdfToBase64 } from '../src/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '../output-samples');

// Create output directory
try {
  mkdirSync(outputDir, { recursive: true });
} catch (e) {
  // Directory may already exist
}

console.log('🎵 Partitura MCP - Comprehensive Test Suite\n');
console.log('=' .repeat(60));

// Test cases with various ABC notations
const testCases = [
  {
    name: 'Simple Scale',
    abc: `X:1
T:C Major Scale
M:4/4
L:1/4
K:C
C D E F | G A B c |`,
    title: 'C Major Scale',
    composer: 'Exercise'
  },
  {
    name: 'Twinkle Twinkle',
    abc: `X:1
T:Twinkle Twinkle Little Star
C:Traditional
M:4/4
L:1/4
K:C
CC GG | AA G2 | FF EE | DD C2 |
GG FF | EE D2 | GG FF | EE D2 |
CC GG | AA G2 | FF EE | DD C2 |]`,
    title: 'Twinkle Twinkle Little Star',
    composer: 'Traditional'
  },
  {
    name: 'Happy Birthday',
    abc: `X:1
T:Happy Birthday
C:Traditional
M:3/4
L:1/4
K:C
G/2>G/2 | A G c | B2 G/2>G/2 | A G d | c2 G/2>G/2 |
g e c | B A F/2>F/2 | e c d | c2 |]`,
    title: 'Happy Birthday',
    composer: 'Traditional'
  },
  {
    name: 'Amazing Grace',
    abc: `X:1
T:Amazing Grace
C:John Newton
M:3/4
L:1/4
K:G
D | G2 B/2A/2 | G2 B | B2 A | G2 E |
D2 D | G2 B/2A/2 | G4 z2 |
B2 d | d2 B | d2 B | B2 A | G2 E |
D2 G | G2 E | G4 z2 |]`,
    title: 'Amazing Grace',
    composer: 'John Newton'
  }
];

let successCount = 0;
let failCount = 0;

console.log('\n📋 Running Tests:\n');

for (const testCase of testCases) {
  process.stdout.write(`  Testing "${testCase.name}"... `);
  
  try {
    // Validate ABC notation
    validateAbcNotation(testCase.abc);
    
    // Convert to PDF
    const pdfBuffer = await abcToPdf(testCase.abc, {
      title: testCase.title,
      composer: testCase.composer
    });
    
    // Save PDF
    const filename = testCase.name.toLowerCase().replace(/\s+/g, '-') + '.pdf';
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, pdfBuffer);
    
    // Get base64 for size calculation
    const base64 = pdfToBase64(pdfBuffer);
    
    console.log(`✓ (${Math.round(pdfBuffer.length / 1024)}KB)`);
    successCount++;
  } catch (error) {
    console.log(`✗ ${error.message}`);
    failCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`  ✓ Passed: ${successCount}`);
console.log(`  ✗ Failed: ${failCount}`);
console.log(`  📁 PDFs saved to: ${outputDir}`);

// Test validation edge cases
console.log('\n🛡️  Testing Security Validation:\n');

const securityTests = [
  {
    name: 'Empty string',
    abc: '',
    shouldFail: true
  },
  {
    name: 'Script injection',
    abc: '<script>alert("xss")</script>X:1\nK:C\nC D E F',
    shouldFail: true
  },
  {
    name: 'Valid with special characters',
    abc: 'X:1\nT:Test - Song (2024)\nK:C\nC D E F |',
    shouldFail: false
  }
];

for (const test of securityTests) {
  process.stdout.write(`  Testing "${test.name}"... `);
  
  try {
    validateAbcNotation(test.abc);
    if (test.shouldFail) {
      console.log('✗ Should have failed but passed');
      failCount++;
    } else {
      console.log('✓ Passed validation');
      successCount++;
    }
  } catch (error) {
    if (test.shouldFail) {
      console.log('✓ Correctly rejected');
      successCount++;
    } else {
      console.log(`✗ Incorrectly rejected: ${error.message}`);
      failCount++;
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n🎉 Final Results:');
console.log(`  Total Tests: ${successCount + failCount}`);
console.log(`  Passed: ${successCount}`);
console.log(`  Failed: ${failCount}`);
console.log(`  Success Rate: ${Math.round((successCount / (successCount + failCount)) * 100)}%`);

if (failCount === 0) {
  console.log('\n✅ All tests passed successfully!');
  console.log('\n📚 Next Steps:');
  console.log('  1. Check generated PDFs in:', outputDir);
  console.log('  2. Start the stdio server: npm run start:stdio');
  console.log('  3. Start the HTTP server: npm run start:http');
  console.log('  4. Integrate with your AI assistant using the examples');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}
