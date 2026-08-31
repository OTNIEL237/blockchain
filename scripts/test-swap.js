const { calculateSwapAmount } = require('../apps/wallet/src/services/swapService');

const rates = {
  BTC: 65000,
  ETH: 3500,
  USDT: 1,
  SOL: 150,
  SGC: 0.10
};

function test(fromToken, toToken, amount) {
  const received = calculateSwapAmount(amount, rates[fromToken], rates[toToken]);
  console.log(`${amount} ${fromToken} -> ${received} ${toToken}`);
}

// Tests
console.log('--- Swap Tests ---');
// 1 SGC to USD (via USDT)
test('SGC', 'USDT', 1);
// 10 USDT to SGC
test('USDT', 'SGC', 10);
// 1 ETH to SGC
test('ETH', 'SGC', 1);
// 100 SGC to BTC
test('SGC', 'BTC', 100);
