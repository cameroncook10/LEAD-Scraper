/**
 * Simple test runner for ES modules
 * Validates all core services work correctly
 */

import marketResearchService from './src/services/market-research-service.js';
import sentimentService from './src/services/sentiment-service.js';
import dataScraperService from './src/services/data-scraper-service.js';
import opusDecisionService from './src/services/opus-decision-service.js';
import improvementAgent from './src/services/improvement-agent.js';
import backtestEngine from './src/services/backtest-engine.js';
import { logger } from './src/utils/logger.js';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

async function asyncTest(name, fn) {
  testsRun++;
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

console.log('=== Trading Bot Service Tests ===\n');

// Market Research Service Tests
console.log('Market Research Service:');

test('should initialize with cache', () => {
  if (!marketResearchService.cache) throw new Error('No cache');
});

test('should map ticker to coin ID', () => {
  const id = marketResearchService.mapTickerToCoinId('BTC');
  if (id !== 'bitcoin') throw new Error(`Expected 'bitcoin', got '${id}'`);
});

test('should classify volatility levels', () => {
  if (marketResearchService.getVolatilityLevel(1) !== 'very_low')
    throw new Error('Wrong volatility classification');
});

test('should calculate standard deviation', () => {
  const stdDev = marketResearchService.calculateStdDev([1, 2, 3, 4, 5]);
  if (stdDev <= 0) throw new Error('Invalid stdDev');
});

// Sentiment Service Tests
console.log('\nSentiment Service:');

test('should initialize sentiment service', () => {
  if (!sentimentService.cache) throw new Error('No cache');
});

test('should calculate aggregate sentiment score', () => {
  const sources = [
    { sentiment: 0.5, engagement: 100 },
    { sentiment: -0.2, engagement: 50 },
    { sentiment: 0.3, engagement: 200 },
  ];
  const score = sentimentService.calculateAggregateScore(sources);
  if (typeof score !== 'number') throw new Error('Score not a number');
  if (Math.abs(score) > 100) throw new Error('Score out of range');
});

test('should generate sentiment signals', () => {
  const signals = sentimentService.generateSentimentSignals(75);
  if (!Array.isArray(signals)) throw new Error('Signals not an array');
  if (signals.length === 0) throw new Error('No signals generated');
});

// Data Scraper Tests
console.log('\nData Scraper Service:');

test('should initialize data scraper', () => {
  if (!dataScraperService.cache) throw new Error('No cache');
});

test('should calculate RSI', () => {
  const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
  const rsi = dataScraperService.calculateRSI(prices, 14);
  if (typeof rsi !== 'number') throw new Error('RSI not a number');
  if (rsi < 0 || rsi > 100) throw new Error('RSI out of range');
});

test('should calculate SMA', () => {
  const prices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const sma = dataScraperService.calculateSMA(prices, 5);
  if (typeof sma !== 'number') throw new Error('SMA not a number');
  if (sma !== 30) throw new Error(`Wrong SMA: ${sma}`);
});

test('should calculate EMA', () => {
  const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 10);
  const ema = dataScraperService.calculateEMA(prices, 12);
  if (typeof ema !== 'number') throw new Error('EMA not a number');
});

test('should map symbol to CoinGecko ID', () => {
  const id = dataScraperService.mapTickerToCoinId('BTC');
  if (id !== 'bitcoin') throw new Error(`Expected 'bitcoin', got '${id}'`);
});

// Opus Decision Service Tests
console.log('\nOpus Decision Service:');

test('should parse BUY decision', () => {
  const response = {
    content: [
      {
        type: 'text',
        text: `DECISION: BUY
CONFIDENCE: 75
POSITION_SIZE: 10%
REASONING: Strong uptrend
ENTRY_PRICE: $50000
STOP_LOSS: 5%
TAKE_PROFIT: 15%`,
      },
    ],
  };

  const mockData = {
    ticker: 'BTC',
    marketData: { price: 50000, isHealthy: true, metrics: {} },
    riskLimits: { maxPositionSize: 25, maxPortfolioRisk: 10 },
    portfolio: { totalRisk: 5 },
  };

  const decision = opusDecisionService.parseDecisionResponse(response, mockData);
  if (decision.decision !== 'BUY') throw new Error('Wrong decision');
  if (decision.confidence !== 75) throw new Error('Wrong confidence');
  if (decision.positionSize !== 10) throw new Error('Wrong position size');
});

test('should parse SELL decision', () => {
  const response = {
    content: [
      {
        type: 'text',
        text: 'DECISION: SELL\nCONFIDENCE: 80\nPOSITION_SIZE: 0%',
      },
    ],
  };

  const mockData = {
    ticker: 'BTC',
    marketData: { price: 50000, isHealthy: true, metrics: {} },
    riskLimits: { maxPositionSize: 25, maxPortfolioRisk: 10 },
    portfolio: { totalRisk: 5 },
  };

  const decision = opusDecisionService.parseDecisionResponse(response, mockData);
  if (decision.decision !== 'SELL') throw new Error('Wrong decision');
});

test('should default to HOLD on error', () => {
  const response = {
    content: [{ type: 'text', text: 'invalid' }],
  };

  const mockData = {
    ticker: 'BTC',
    marketData: { price: 50000, isHealthy: true, metrics: {} },
    riskLimits: { maxPositionSize: 25, maxPortfolioRisk: 10 },
    portfolio: { totalRisk: 5 },
  };

  const decision = opusDecisionService.parseDecisionResponse(response, mockData);
  if (decision.decision !== 'HOLD') throw new Error('Should default to HOLD');
});

test('should validate execution criteria', () => {
  const goodDecision = {
    decision: 'BUY',
    confidence: 75,
    positionSize: 10,
  };

  const mockData = {
    ticker: 'BTC',
    marketData: { price: 50000, isHealthy: true },
    riskLimits: { maxPositionSize: 25, minConfidence: 60, maxPortfolioRisk: 10 },
    portfolio: { totalRisk: 5 },
  };

  const result = opusDecisionService.shouldExecuteTrade(goodDecision, mockData);
  if (result !== true) throw new Error('Should allow execution');
});

test('should reject low confidence', () => {
  const badDecision = {
    decision: 'BUY',
    confidence: 40,
    positionSize: 10,
  };

  const mockData = {
    ticker: 'BTC',
    marketData: { price: 50000, isHealthy: true },
    riskLimits: { maxPositionSize: 25, minConfidence: 60, maxPortfolioRisk: 10 },
    portfolio: { totalRisk: 5 },
  };

  const result = opusDecisionService.shouldExecuteTrade(badDecision, mockData);
  if (result !== false) throw new Error('Should reject low confidence');
});

// Improvement Agent Tests
console.log('\nImprovement Agent:');

test('should calculate performance metrics', () => {
  const decisions = [];
  const trades = [
    {
      timestamp: new Date().toISOString(),
      symbol: 'BTC',
      entryPrice: 50000,
      exitPrice: 52000,
      pnl: 4,
    },
    {
      timestamp: new Date().toISOString(),
      symbol: 'BTC',
      entryPrice: 52000,
      exitPrice: 50000,
      pnl: -3.8,
    },
  ];

  const metrics = improvementAgent.calculatePerformanceMetrics(decisions, trades);
  if (metrics.totalTrades !== 2) throw new Error('Wrong trade count');
  if (metrics.winningTrades !== 1) throw new Error('Wrong win count');
});

test('should identify best symbols', () => {
  const trades = [
    { symbol: 'BTC', entryPrice: 50000, exitPrice: 52000 },
    { symbol: 'BTC', entryPrice: 52000, exitPrice: 51000 },
    { symbol: 'ETH', entryPrice: 3000, exitPrice: 3300 },
  ];

  const best = improvementAgent.identifyBestSymbols(trades);
  if (!Array.isArray(best)) throw new Error('Should return array');
});

// Backtest Engine Tests
console.log('\nBacktest Engine:');

test('should convert period to days', () => {
  if (backtestEngine.periodToDays('7d') !== 7) throw new Error('Wrong conversion');
  if (backtestEngine.periodToDays('90d') !== 90) throw new Error('Wrong conversion');
  if (backtestEngine.periodToDays('1y') !== 365) throw new Error('Wrong conversion');
});

test('should map symbol to coin ID', () => {
  if (backtestEngine.mapSymbolToCoinId('BTC') !== 'bitcoin')
    throw new Error('Wrong mapping');
  if (backtestEngine.mapSymbolToCoinId('ETH') !== 'ethereum')
    throw new Error('Wrong mapping');
});

test('should calculate max drawdown', () => {
  const trades = [
    { entry: 100, exit: 110 },
    { entry: 110, exit: 90 },
    { entry: 90, exit: 105 },
  ];

  const dd = backtestEngine.calculateMaxDrawdown(trades);
  if (dd <= 0) throw new Error('Drawdown should be positive');
});

// Summary
console.log('\n=== Test Results ===');
console.log(`Total: ${testsRun}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log(`\n✗ ${testsFailed} test(s) failed`);
  process.exit(1);
}
