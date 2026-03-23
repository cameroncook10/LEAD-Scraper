import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

/**
 * Opus Decision Service
 * Uses Anthropic's Claude Opus to make trading decisions
 * Integrates market research, sentiment, technical indicators, and risk management
 */

class OpusDecisionService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.model = 'claude-opus-4-20250514'; // Using Opus 4.6 for superior decision quality
    this.maxTokens = 4096;
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes for decisions
  }

  /**
   * Make a trading decision based on comprehensive market analysis
   */
  async makeTradeDecision(analysisData) {
    try {
      logger.info('Making trade decision with Opus', {
        ticker: analysisData.ticker,
      });

      // Build comprehensive prompt with all market data
      const prompt = this.buildDecisionPrompt(analysisData);

      // Call Opus
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Parse response
      const decision = this.parseDecisionResponse(response, analysisData);

      // Log for improvement loop
      this.logDecisionMetrics(decision, analysisData);

      return decision;
    } catch (error) {
      logger.error('Error making trade decision', error);
      return {
        decision: 'HOLD',
        confidence: 0,
        reasoning: `Error: ${error.message}`,
        shouldExecute: false,
        error: error.message,
      };
    }
  }

  /**
   * Build comprehensive decision prompt
   */
  buildDecisionPrompt(data) {
    const {
      ticker,
      marketData,
      sentiment,
      technicalData,
      tradeHistory,
      portfolio,
      riskLimits,
    } = data;

    return `You are an expert algorithmic trading decision engine. Analyze the following market data and make a trading decision.

TICKER: ${ticker}

MARKET CONDITIONS:
- Price: $${marketData?.price || 'N/A'}
- Market Cap: $${marketData?.metrics?.marketCap || 'N/A'}
- Volume 24h: $${marketData?.metrics?.volume24h || 'N/A'}
- Volatility (24h): ${marketData?.metrics?.volatility24h || 'N/A'}%
- Market Health: ${marketData?.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}
- Volume to Market Cap Ratio: ${marketData?.metrics?.volumeToMarketCapRatio || 'N/A'}%

SENTIMENT ANALYSIS:
- Overall Score: ${sentiment?.score || 0} (-100 to +100)
- Confidence: ${sentiment?.confidence || 0}%
- Breakdown: ${sentiment?.breakdown?.positive || 0} positive, ${sentiment?.breakdown?.negative || 0} negative, ${sentiment?.breakdown?.neutral || 0} neutral
- Signals: ${sentiment?.signals?.join(', ') || 'None'}

TECHNICAL INDICATORS:
- RSI (14): ${technicalData?.technicalIndicators?.rsi || 'N/A'}
- EMA 20: $${technicalData?.technicalIndicators?.ema20 || 'N/A'}
- EMA 50: $${technicalData?.technicalIndicators?.ema50 || 'N/A'}
- SMA 200: $${technicalData?.technicalIndicators?.sma200 || 'N/A'}
- MACD: ${technicalData?.technicalIndicators?.macd?.line?.toFixed(2) || 'N/A'}
- Liquidity Score: ${technicalData?.liquidity?.liquidityScore || 0}/100
- Liquidity Status: ${technicalData?.liquidity?.status || 'unknown'}

PORTFOLIO STATUS:
- Current Position: ${portfolio?.currentPosition || 'NONE'}
- Current Value: $${portfolio?.value || 0}
- Total Risk: ${portfolio?.totalRisk || 0}%
- Available Capital: $${portfolio?.availableCapital || 0}

RISK LIMITS:
- Max Position Size: ${riskLimits?.maxPositionSize || 25}%
- Max Portfolio Risk: ${riskLimits?.maxPortfolioRisk || 10}%
- Min Confidence for Trade: ${riskLimits?.minConfidence || 60}%

RECENT TRADE HISTORY (Last 5 trades):
${this.formatTradeHistory(tradeHistory)}

DECISION REQUIREMENTS:
Based on the above data, provide your decision in the following format:

DECISION: [BUY / SELL / HOLD]
CONFIDENCE: [0-100]
POSITION_SIZE: [0-${riskLimits?.maxPositionSize || 25}]% of available capital
REASONING: [2-3 sentences explaining your decision]
ENTRY_PRICE: [$${marketData?.price || 'current'}]
STOP_LOSS: [percentage below entry, e.g., 5%]
TAKE_PROFIT: [percentage above entry, e.g., 15%]

Consider:
1. Market health and liquidity
2. Sentiment trend and signal strength
3. Technical indicators alignment
4. Recent win/loss ratio from trade history
5. Risk/reward ratio
6. Position sizing relative to portfolio risk limits

Only recommend BUY if:
- Market is healthy
- Confidence > 60%
- Sentiment is positive or neutral
- Multiple technical indicators align
- Risk-adjusted position size keeps portfolio risk < 10%
- No major red flags in recent history

Be conservative with capital at risk. Prioritize capital preservation over aggressive returns.`;
  }

  /**
   * Format trade history for prompt
   */
  formatTradeHistory(history) {
    if (!history || history.length === 0) {
      return '- No prior trades';
    }

    return history
      .slice(-5)
      .map(
        (trade, i) =>
          `${i + 1}. ${trade.symbol} ${trade.type} @$${trade.entryPrice} → ${trade.exitPrice ? '$' + trade.exitPrice : 'OPEN'} | P&L: ${trade.pnl ? trade.pnl.toFixed(2) + '%' : 'pending'}`
      )
      .join('\n');
  }

  /**
   * Parse Opus response into structured decision
   */
  parseDecisionResponse(response, analysisData) {
    try {
      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      const decision = {
        ticker: analysisData.ticker,
        timestamp: new Date().toISOString(),
        decision: 'HOLD',
        confidence: 0,
        positionSize: 0,
        reasoning: '',
        entryPrice: analysisData.marketData?.price,
        stopLoss: null,
        takeProfitPrice: null,
        shouldExecute: false,
        rawResponse: text,
      };

      // Parse decision line
      const decisionMatch = text.match(/DECISION:\s*(BUY|SELL|HOLD)/i);
      if (decisionMatch) {
        decision.decision = decisionMatch[1].toUpperCase();
      }

      // Parse confidence
      const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
      if (confidenceMatch) {
        decision.confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)));
      }

      // Parse position size
      const positionMatch = text.match(/POSITION_SIZE:\s*([0-9.]+)%/i);
      if (positionMatch) {
        decision.positionSize = Math.min(
          analysisData.riskLimits?.maxPositionSize || 25,
          parseFloat(positionMatch[1])
        );
      }

      // Parse reasoning
      const reasoningMatch = text.match(/REASONING:\s*(.+?)(?:ENTRY_PRICE|$)/is);
      if (reasoningMatch) {
        decision.reasoning = reasoningMatch[1].trim().slice(0, 200);
      }

      // Parse stop loss
      const stopLossMatch = text.match(/STOP_LOSS:\s*([0-9.]+)%/i);
      if (stopLossMatch && decision.entryPrice) {
        const stopLossPercent = parseFloat(stopLossMatch[1]);
        decision.stopLoss = decision.entryPrice * (1 - stopLossPercent / 100);
      }

      // Parse take profit
      const tpMatch = text.match(/TAKE_PROFIT:\s*([0-9.]+)%/i);
      if (tpMatch && decision.entryPrice) {
        const tpPercent = parseFloat(tpMatch[1]);
        decision.takeProfitPrice = decision.entryPrice * (1 + tpPercent / 100);
      }

      // Determine if trade should execute
      decision.shouldExecute = this.shouldExecuteTrade(decision, analysisData);

      return decision;
    } catch (error) {
      logger.error('Error parsing decision response', error);
      return {
        decision: 'HOLD',
        confidence: 0,
        positioning: 0,
        reasoning: `Parsing error: ${error.message}`,
        shouldExecute: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate trade execution criteria
   */
  shouldExecuteTrade(decision, analysisData) {
    // Must meet all criteria to execute
    const minConfidence = analysisData.riskLimits?.minConfidence || 60;
    const maxPortfolioRisk = analysisData.riskLimits?.maxPortfolioRisk || 10;
    const maxPositionSize = analysisData.riskLimits?.maxPositionSize || 25;

    const checks = {
      decisionBUY: decision.decision === 'BUY',
      confidenceOK: decision.confidence >= minConfidence,
      positionSizeOK: decision.positionSize <= maxPositionSize,
      portfolioRiskOK: analysisData.portfolio?.totalRisk < maxPortfolioRisk,
      marketHealthy: analysisData.marketData?.isHealthy !== false,
    };

    logger.info('Trade execution checks', checks);

    return (
      checks.decisionBUY &&
      checks.confidenceOK &&
      checks.positionSizeOK &&
      checks.portfolioRiskOK &&
      checks.marketHealthy
    );
  }

  /**
   * Log decision metrics for improvement loop
   */
  logDecisionMetrics(decision, analysisData) {
    const metrics = {
      timestamp: new Date().toISOString(),
      ticker: analysisData.ticker,
      decision: decision.decision,
      confidence: decision.confidence,
      shouldExecute: decision.shouldExecute,
      sentiment: analysisData.sentiment?.score,
      volatility: analysisData.marketData?.metrics?.volatility24h,
      marketHealthy: analysisData.marketData?.isHealthy,
      rsi: analysisData.technicalData?.technicalIndicators?.rsi,
    };

    logger.info('Decision metrics', metrics);

    // Store for improvement loop
    if (process.env.DECISION_LOG_PATH) {
      // Would append to log file for improvement agent to analyze
    }
  }

  /**
   * Get historical decision accuracy
   * Used to calibrate confidence thresholds
   */
  getDecisionAccuracy(timeWindow = 24 * 60 * 60 * 1000) {
    // This would read from logged decisions and outcomes
    // Used by improvement agent to refine decision parameters

    return {
      totalDecisions: 0,
      correctDecisions: 0,
      accuracy: 0,
      confidenceCalibration: {},
      timestamp: new Date().toISOString(),
    };
  }
}

export default new OpusDecisionService();
