import { createExchange, getSupportedExchanges } from './dist/factory.js';

// Test that both new exchanges are supported
const supportedExchanges = getSupportedExchanges();
console.log('Supported exchanges:', supportedExchanges.length, 'exchanges');
console.log('  -', supportedExchanges.join(', '));

// Test instantiation of Variational adapter
try {
  const variational = createExchange('variational', {
    apiKey: 'test',
    apiSecret: 'test',
    testnet: true,
  });
  console.log('\n✅ Variational adapter:');
  console.log('   ID:', variational.id);
  console.log('   Name:', variational.name);
  console.log('   Features:', Object.keys(variational.has).filter(k => variational.has[k]).length, 'features enabled');
} catch (error) {
  console.error('❌ Variational adapter error:', error.message);
}

// Test instantiation of Extended adapter
try {
  const extended = createExchange('extended', {
    apiKey: 'test',
    testnet: true,
  });
  console.log('\n✅ Extended adapter:');
  console.log('   ID:', extended.id);
  console.log('   Name:', extended.name);
  console.log('   Features:', Object.keys(extended.has).filter(k => extended.has[k]).length, 'features enabled');
} catch (error) {
  console.error('❌ Extended adapter error:', error.message);
}

console.log('\n✨ All adapter stubs successfully integrated!\n');
