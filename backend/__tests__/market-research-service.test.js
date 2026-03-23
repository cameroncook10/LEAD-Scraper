import marketResearchService from '../src/services/market-research-service.js';

describe('MarketResearchService', () => {
  beforeEach(() => {
    // Clear cache before each test
    marketResearchService.cache.clear();
  });

  describe('analyzeMarketConditions', () => {
    test('should return market data object with required fields', async () => {
      const result = await marketResearchService.analyzeMarketConditions('BTC');

      expect(result).toHaveProperty('ticker', 'BTC');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('isHealthy');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('warnings');
    });

    test('should cache results', async () => {
      const result1 = await marketResearchService.analyzeMarketConditions('ETH');
      const cached = marketResearchService.getCached('market_ETH');

      expect(cached).toEqual(result1);
    });

    test('should handle invalid tickers gracefully', async () => {
      const result = await marketResearchService.analyzeMarketConditions('INVALID');

      expect(result.isHealthy).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeCompetitors', () => {
    test('should return competitor data', async () => {
      const result = await marketResearchService.analyzeCompetitors('BTC');

      expect(result).toHaveProperty('ticker', 'BTC');
      expect(result).toHaveProperty('competitors');
      expect(result).toHaveProperty('marketPosition');
      expect(Array.isArray(result.competitors)).toBe(true);
    });
  });

  describe('detectTrends', () => {
    test('should detect market trends', async () => {
      const result = await marketResearchService.detectTrends('BTC', '7d');

      expect(result).toHaveProperty('trendDirection');
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('signals');
      expect(Array.isArray(result.signals)).toBe(true);
    });

    test('should calculate volatility', async () => {
      const result = await marketResearchService.detectTrends('ETH', '24h');

      expect(result).toHaveProperty('volatility');
      expect(typeof result.volatility).toBe('number');
    });
  });

  describe('validateMarketHealth', () => {
    test('should return true for healthy market', () => {
      const healthyData = {
        metrics: {
          price: 50000,
          volatility24h: 5,
          volumeToMarketCapRatio: 2,
        },
      };

      const result = marketResearchService.validateMarketHealth(healthyData);
      expect(result).toBe(true);
    });

    test('should return false for unhealthy market', () => {
      const unhealthyData = {
        metrics: {
          price: null,
          volatility24h: 50,
        },
      };

      const result = marketResearchService.validateMarketHealth(unhealthyData);
      expect(result).toBe(false);
    });
  });

  describe('Helper methods', () => {
    test('mapTickerToCoinId should return correct coin IDs', () => {
      expect(marketResearchService.mapTickerToCoinId('BTC')).toBe('bitcoin');
      expect(marketResearchService.mapTickerToCoinId('ETH')).toBe('ethereum');
      expect(marketResearchService.mapTickerToCoinId('UNKNOWN')).toBe('unknown');
    });

    test('getVolatilityLevel should classify volatility', () => {
      expect(marketResearchService.getVolatilityLevel(1)).toBe('very_low');
      expect(marketResearchService.getVolatilityLevel(5)).toBe('low');
      expect(marketResearchService.getVolatilityLevel(15)).toBe('high');
      expect(marketResearchService.getVolatilityLevel(25)).toBe('very_high');
    });

    test('calculateStdDev should return correct standard deviation', () => {
      const values = [1, 2, 3, 4, 5];
      const result = marketResearchService.calculateStdDev(values);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });
  });
});
