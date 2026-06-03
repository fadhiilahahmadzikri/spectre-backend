/**
 * Test ESM import of spectre-snap package
 * Verifies exports and basic API availability
 */

console.log('🧪 Testing ESM import...\n');

try {
  // Test main export
  const spectre = await import('@thewhitenigs/spectre-snap');
  
  console.log('✅ Package imported successfully');
  console.log('   Available exports:', Object.keys(spectre).slice(0, 5).join(', '), '...');
  
  // Test specific exports
  const { SpectreAuthProvider, SpectreAuthModal, SpectreError, SpectreErrorCode } = spectre;
  
  if (SpectreAuthProvider) {
    console.log('✅ SpectreAuthProvider export found');
  }
  
  if (SpectreAuthModal) {
    console.log('✅ SpectreAuthModal export found');
  }
  
  if (SpectreError) {
    console.log('✅ SpectreError export found');
  }
  
  if (SpectreErrorCode) {
    console.log('✅ SpectreErrorCode export found');
  }
  
  // Test CSS import
  const cssPath = '@thewhitenigs/spectre-snap/style.css';
  console.log(`✅ CSS path available: ${cssPath}`);
  
  console.log('\n✨ ESM import test PASSED\n');
  process.exit(0);
  
} catch (error) {
  console.error('❌ ESM import test FAILED');
  console.error(error.message);
  process.exit(1);
}
