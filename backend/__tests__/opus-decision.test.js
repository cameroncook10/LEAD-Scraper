import opusDecisionService from '../src/services/opus-decision-service.js';

describe('OpusDecisionService', () => {
  const mockAnalysisData = {
    ticker: 'BTC',
    marketData: {
      price: 50000,
      isHealthy: true,
      metrics: {
        volume24h: 30000000000,
        volatility24h: 5,
      },
    },
    sentiment: {
      score: 20,
      confidence: 75,
      signals: ['Positive sentiment'],
    },
    technicalData: {
      technicalIndicators: {
        rsi: 55,
        ema20: 49500,
        sma200: 48000,
      },
      liquidity: {
        liquidityScore: 85,
        status: 'good',
      },
    },
    portfolio: {
      value: 10000,
      totalRisk: 5,
      availableCapital: 10000,
    },
    riskLimits: {
      minConfidence: 60,
      maxPositionSize: 25,
      maxPortfolioRisk: 10,
    },
    tradeHistory: [],
  };

  describe('parseDecisionResponse', () => {
    test('should parse decision response correctly', () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: `DECISION: BUY
CONFIDENCE: 75
POSITION_SIZE: 10% of available capital
REASONING: Market looks bullish with RSI at 55 and positive sentiment.
ENTRY_PRICE: $50000
STOP_LOSS: 5%
TAKE_PROFIT: 15%`,
          },
        ],
      };

      const result = opusDecisionService.parseDecisionResponse(mockResponse, mockAnalysisData);

      expect(result.decision).toBe('BUY');
      expect(result.confidence).toBe(75);
      expect(result.positionSize).toBe(10);
      expect(result.reasoning).toContain('bullish');
      expect(result.stopLoss).toBeCloseTo(47500, 0);
      expect(result.takeProfitPrice).toBeCloseTo(57500, 0);
    });

    test('should default to HOLD on parse error', () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'invalid response' }],
      };

      const result = opusDecisionService.parseDecisionResponse(mockResponse, mockAnalysisData);

      expect(result.decision).toBe('HOLD');
      expect(result.confidence).toBe(0);
    });

    test('should parse SELL decision', () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: `DECISION: SELL
CONFIDENCE: 80
POSITION_SIZE: 0%
REASONING: Bearish divergence detected.
ENTRY_PRICE: $50000
STOP_LOSS: 10%
TAKE_PROFIT: 5%`,
          },
        ],
      };

      const result = opusDecisionService.parseDecisionResponse(mockResponse, mockAnalysisData);

      expect(result.decision).toBe('SELL');
      expect(result.confidence).toBe(80);
    });
  });

  describe('shouldExecuteTrade', () => {
    test('should execute BUY when all criteria are met', () => {
      const decision = {
        decision: 'BUY',
        confidence: 75,
        positionSize: 10,
      };

      const result = opusDecisionService.shouldExecuteTrade(decision, mockAnalysisData);

      expect(result).toBe(true);
    });

    test('should not execute when confidence below minimum', () => {
      const decision = {
        decision: 'BUY',
        confidence: 45,
        positionSize: 10,
      };

      const result = opusDecisionService.shouldExecuteTrade(decision, mockAnalysisData);

      expect(result).toBe(false);
    });

    test('should not execute on HOLD or SELL', () => {
      const decision = {
        decision: 'HOLD',
        confidence: 75,
        positionSize: 0,
      };

      const result = opusDecisionService.shouldExecuteTrade(decision, mockAnalysisData);

      expect(result).toBe(false);
    });

    test('should not execute when position size exceeds limit', () => {
      const decision = {
        decision: 'BUY',
        confidence: 75,
        positionSize: 50,
      };

      const result = opusDecisionService.shouldExecuteTrade(decision, mockAnalysisData);

      expect(result).toBe(false);
    });

    test('should not execute when market unhealthy', () => {
      const unhealthyData = {
        ...mockAnalysisData,
        marketData: { ...mockAnalysisData.marketData, isHealthy: false },
      };

      const decision = {
        decision: 'BUY',
        confidence: 75,
        positionSize: 10,
      };

      const result = opusDecisionService.shouldExecuteTrade(decision, unhealthyData);

      expect(result).toBe(false);
    });
  });

  describe('buildDecisionPrompt', () => {
    test('should build a comprehensive prompt', () => {
      const prompt = opusDecisionService.buildDecisionPrompt(mockAnalysisData);

      expect(prompt).toContain('BTC');
      expect(prompt).toContain('Market Conditions');
      expect(prompt).toContain('Sentiment');
      expect(prompt).toContain('Technical Indicators');
      expect(prompt).toContain('Decision Requirement');
      expect(prompt).toContain('BUY / SELL / HOLD');
    });
  });

  describe('getDecisionAccuracy', () => {
    test('should return accuracy metrics', () => {
      const result = opusDecisionService.getDecisionAccuracy();

      expect(result).toHaveProperty('totalDecisions');
      expect(result).toHaveProperty('correctDecisions');
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
