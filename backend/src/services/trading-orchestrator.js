/**
 * Trading Orchestrator
 * Orchestrates all services into complete trading workflow
 * This is the main entry point for trading bot execution
 */

import { logger } from '../utils/logger.js';
import marketResearchService from './market-research-service.js';
import sentimentService from './sentiment-service.js';
import dataScraperService from './data-scraper-service.js';
import opusDecisionService from './opus-decision-service.js';
import improvementAgent from './improvement-agent.js';
import backtestEngine from './backtest-engine.js';
import { tradingConfig } from '../config/trading-config.js';
import fs from 'fs';
import path from 'path';

class TradingOrchestrator {
  constructor() {
    this.portfolio = {
      cash: tradingConfig.trading.startCapital,
      positions: [],
      totalValue: tradingConfig.trading.startCapital,
      totalRisk: 0,
    };

    this.tradeLog = [];
    this.decisionLog = [];
    this.logsDir = tradingConfig.logging.logsDir;
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Full trading cycle: analyze → decide → execute
   */
  async runTradingCycle(symbol) {
    try {
      logger.info(`Starting trading cycle for ${symbol}`);

      // Step 1: Gather all market data
      const [marketData, sentiment, technicalData] = await Promise.all([
        marketResearchService.analyzeMarketConditions(symbol),
        sentimentService.getSentiment(symbol, this.mapSymbolToName(symbol)),
        dataScraperService.scrapeMarketData(symbol),
      ]);

      // Step 2: Build comprehensive analysis
      const analysisData = {
        ticker: symbol,
        marketData,
        sentiment,
        technicalData,
        portfolio: this.portfolio,
        riskLimits: {
          minConfidence: tradingConfig.thresholds.minConfidence,
          maxPositionSize: tradingConfig.thresholds.maxPositionSize,
          maxPortfolioRisk: tradingConfig.thresholds.maxPortfolioRisk,
        },
        tradeHistory: this.tradeLog.slice(-10),
      };

      // Step 3: Get Opus decision
      const decision = await opusDecisionService.makeTradeDecision(analysisData);

      // Step 4: Log decision
      this.logDecision({
        timestamp: new Date().toISOString(),
        symbol,
        ...decision,
        sentiment: sentiment.score,
        volatility: marketData.metrics?.volatility24h,
      });

      // Step 5: Execute if criteria met
      if (decision.shouldExecute && !tradingConfig.trading.paperTrading) {
        logger.info(`Executing ${decision.decision} for ${symbol} at ${decision.confidence}% confidence`);
        await this.executeTrade(symbol, decision, marketData);
      } else if (decision.shouldExecute && tradingConfig.trading.paperTrading) {
        logger.info(`[PAPER] Would execute ${decision.decision} for ${symbol}`);
        await this.simulateTrade(symbol, decision, marketData);
      } else {
        logger.info(`No trade: ${decision.reasoning}`);
      }

      return decision;
    } catch (error) {
      logger.error(`Error in trading cycle for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Execute trade (paper or live)
   */
  async executeTrade(symbol, decision, marketData) {
    try {
      const trade = {
        timestamp: new Date().toISOString(),
        type: decision.decision,
        symbol,
        entryPrice: marketData.price,
        quantity: (this.portfolio.cash * (decision.positionSize / 100)) / marketData.price,
        stopLoss: decision.stopLoss,
        takeProfit: decision.takeProfitPrice,
        confidence: decision.confidence,
      };

      // Update portfolio (simplified)
      this.portfolio.positions.push(trade);
      this.portfolio.cash -= trade.quantity * marketData.price;
      this.portfolio.totalRisk += decision.positionSize / 100;

      this.tradeLog.push(trade);
      logger.info('Trade executed', {
        symbol,
        type: decision.decision,
        quantity: trade.quantity.toFixed(4),
        price: marketData.price,
      });

      return trade;
    } catch (error) {
      logger.error('Trade execution failed', error);
      return null;
    }
  }

  /**
   * Simulate trade (paper trading)
   */
  async simulateTrade(symbol, decision, marketData) {
    const trade = {
      timestamp: new Date().toISOString(),
      type: decision.decision,
      symbol,
      entryPrice: marketData.price,
      quantity: (this.portfolio.cash * (decision.positionSize / 100)) / marketData.price,
      confidence: decision.confidence,
      simulated: true,
    };

    this.tradeLog.push(trade);
    logger.info('[PAPER] Simulated trade', {
      symbol,
      type: decision.decision,
      quantity: trade.quantity.toFixed(4),
      price: marketData.price,
    });

    return trade;
  }

  /**
   * Run improvement analysis cycle
   */
  async runImprovementCycle() {
    logger.info('Running improvement analysis cycle');
    return await improvementAgent.analyze();
  }

  /**
   * Run backtest
   */
  async runBacktest(options) {
    logger.info('Running backtest', options);
    return await backtestEngine.runBacktest(options);
  }

  /**
   * Log decision for history
   */
  logDecision(decision) {
    const logPath = path.join(this.logsDir, 'decision-history.json');

    let history = [];
    if (fs.existsSync(logPath)) {
      try {
        history = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (e) {
        history = [];
      }
    }

    history.push(decision);

    // Keep last 1000 decisions
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    fs.writeFileSync(logPath, JSON.stringify(history, null, 2));
  }

  /**
   * Get portfolio status
   */
  getPortfolioStatus() {
    return {
      timestamp: new Date().toISOString(),
      totalValue: this.portfolio.totalValue,
      cash: this.portfolio.cash,
      positions: this.portfolio.positions.length,
      totalRisk: this.portfolio.totalRisk,
      return: ((this.portfolio.totalValue - tradingConfig.trading.startCapital) /
        tradingConfig.trading.startCapital) *
        100,
    };
  }

  /**
   * Map symbol to full name for sentiment analysis
   */
  mapSymbolToName(symbol) {
    const mapping = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      XRP: 'ripple',
      ADA: 'cardano',
      DOGE: 'dogecoin',
    };

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}

export default new TradingOrchestrator();
