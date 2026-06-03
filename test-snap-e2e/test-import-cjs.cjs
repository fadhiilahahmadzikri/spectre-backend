/**
 * Test CommonJS import of spectre-snap package
 * Verifies CJS exports work correctly
 */

console.log('🧪 Testing CJS import...\n');

try {
  // Test main export
  const spectre = require('@thewhitenigs/spectre-snap');
  
  console.log('✅ Package imported successfully via CJS');
  console.log('   Available exports:', Object.keys(spectre).slice(0, 5).join(', '), '...');
  
  // Test specific exports
  const { SpectreAuthProvider, SpectreAuthModal, SpectreError, SpectreErrorCode } = spectre;
  
  if (SpectreAuthProvider) {
    console.log('✅ SpectreAuthProvider export found (CJS)');
  }
  
  if (SpectreAuthModal) {
    console.log('✅ SpectreAuthModal export found (CJS)');
  }
  
  if (SpectreError) {
    console.log('✅ SpectreError export found (CJS)');
  }
  
  if (SpectreErrorCode) {
    console.log('✅ SpectreErrorCode export found (CJS)');
  }
  
  console.log('\n✨ CJS import test PASSED\n');
  process.exit(0);
  
} catch (error) {
  console.error('❌ CJS import test FAILED');
  console.error(error.message);
  process.exit(1);
}
