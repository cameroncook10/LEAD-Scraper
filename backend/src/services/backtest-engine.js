import axios from 'axios';
import { logger } from '../utils/logger.js';
import opusDecisionService from './opus-decision-service.js';

/**
 * Backtesting Engine
 * Simulates trades using Opus decisions with historical data
 * Validates strategy performance before live deployment
 */

class BacktestEngine {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Run backtest on a symbol for a given period
   */
  async runBacktest(options) {
    const {
      symbol,
      period = '90d',
      startCapital = 10000,
      positionSize = 0.25,
      minConfidence = 60,
    } = options;

    try {
      logger.info('Starting backtest', { symbol, period, startCapital });

      // Load historical data
      const history = await this.loadHistoricalData(symbol, period);
      if (!history || history.length < 2) {
        throw new Error('Insufficient historical data');
      }

      // Simulate trading
      const results = await this.simulateTrades(
        symbol,
        history,
        startCapital,
        positionSize,
        minConfidence
      );

      // Calculate performance metrics
      const metrics = this.calculateMetrics(results, startCapital);

      return {
        symbol,
        period,
        startCapital,
        results,
        metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Backtest failed for ${symbol}`, error);
      return {
        symbol,
        period,
        error: error.message,
        metrics: null,
      };
    }
  }

  /**
   * Load historical price data
   */
  async loadHistoricalData(symbol, period) {
    try {
      const days = this.periodToDays(period);
      const coinId = this.mapSymbolToCoinId(symbol);

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
        { timeout: 5000 }
      );

      // Format data: add indicators
      const prices = response.data.prices;
      const volumes = response.data.total_volumes || [];

      return prices.map((price, index) => ({
        timestamp: new Date(price[0]).toISOString(),
        close: price[1],
        volume: volumes[index]?.[1] || 0,
        index,
      }));
    } catch (error) {
      logger.error(`Error loading historical data for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Simulate trades based on Opus decisions
   */
  async simulateTrades(symbol, history, startCapital, positionSize, minConfidence) {
    const trades = [];
    let portfolio = {
      cash: startCapital,
      position: null,
      value: startCapital,
      trades: 0,
    };

    // Simulated moving average for "market data"
    const sma20 = this.calculateSMA(
      history.map((h) => h.close),
      20
    );

    for (let i = 50; i < history.length; i++) {
      const candle = history[i];
      const currentPrice = candle.close;

      // Skip if insufficient data
      if (i < 50) continue;

      // Build mock analysis for decision
      const analysisData = {
        ticker: symbol,
        marketData: {
          price: currentPrice,
          isHealthy: true,
          metrics: {
            volatility24h: this.calculateVolatility(
              history.slice(Math.max(0, i - 24), i).map((h) => h.close)
            ),
          },
        },
        sentiment: { score: 0, confidence: 80 }, // Neutral sentiment
        technicalData: {
          technicalIndicators: {
            sma20: sma20[i] || currentPrice,
            rsi: this.calculateRSI(history.slice(0, i).map((h) => h.close), 14),
          },
          liquidity: { liquidityScore: 80, status: 'good' },
        },
        portfolio: {
          value: portfolio.value,
          totalRisk: 5,
          availableCapital: portfolio.cash,
        },
        riskLimits: {
          minConfidence,
          maxPositionSize: positionSize * 100,
          maxPortfolioRisk: 10,
        },
        tradeHistory: trades.slice(-5),
      };

      try {
        // Get Opus decision
        const decision = await opusDecisionService.makeTradeDecision(analysisData);

        // Execute if criteria met
        if (
          decision.shouldExecute &&
          decision.decision === 'BUY' &&
          !portfolio.position
        ) {
          // Buy
          const tradeSize = portfolio.cash * (decision.positionSize / 100);
          const quantity = tradeSize / currentPrice;

          portfolio.position = {
            entryPrice: currentPrice,
            quantity,
            entryTime: candle.timestamp,
            stopLoss: decision.stopLoss,
            takeProfit: decision.takeProfitPrice,
          };

          portfolio.cash -= tradeSize;
          portfolio.trades++;

          trades.push({
            type: 'BUY',
            price: currentPrice,
            quantity,
            timestamp: candle.timestamp,
            index: i,
          });
        } else if (portfolio.position) {
          // Check exit conditions
          const positionValue = portfolio.position.quantity * currentPrice;
          const pnl = ((currentPrice - portfolio.position.entryPrice) /
            portfolio.position.entryPrice) *
            100;

          // Exit if stop loss or take profit hit
          if (
            currentPrice <= portfolio.position.stopLoss ||
            currentPrice >= portfolio.position.takeProfit ||
            decision.decision === 'SELL'
          ) {
            portfolio.cash +=
              portfolio.position.quantity * currentPrice;
            portfolio.position = null;

            trades.push({
              type: 'SELL',
              price: currentPrice,
              timestamp: candle.timestamp,
              pnl,
              index: i,
            });
          }
        }

        // Update portfolio value
        if (portfolio.position) {
          portfolio.value =
            portfolio.cash +
            portfolio.position.quantity * currentPrice;
        } else {
          portfolio.value = portfolio.cash;
        }
      } catch (error) {
        logger.warn(`Trade simulation error at index ${i}: ${error.message}`);
      }
    }

    // Close any open position at end
    if (portfolio.position) {
      const lastPrice = history[history.length - 1].close;
      portfolio.cash += portfolio.position.quantity * lastPrice;
      portfolio.position = null;
    }

    portfolio.value = portfolio.cash;

    return {
      trades,
      finalPortfolio: portfolio,
    };
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics(results, startCapital) {
    const { trades, finalPortfolio } = results;

    // Find buy-sell pairs
    const closedTrades = [];
    let openTrade = null;

    trades.forEach((trade) => {
      if (trade.type === 'BUY') {
        openTrade = trade;
      } else if (trade.type === 'SELL' && openTrade) {
        closedTrades.push({
          entry: openTrade.price,
          exit: trade.price,
          pnl: trade.pnl,
        });
        openTrade = null;
      }
    });

    // Calculate metrics
    const totalReturn =
      ((finalPortfolio.value - startCapital) / startCapital) * 100;

    let winningTrades = 0;
    let losingTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;

    closedTrades.forEach((trade) => {
      if (trade.pnl > 0) {
        winningTrades++;
        totalWins += trade.pnl;
      } else if (trade.pnl < 0) {
        losingTrades++;
        totalLosses += Math.abs(trade.pnl);
      }
    });

    const winRate = closedTrades.length > 0 ?
      (winningTrades / closedTrades.length) * 100 : 0;

    const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0;

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Sharpe ratio (simplified, using daily returns)
    const dailyReturns = closedTrades.map((t) =>
      Math.log(t.exit / t.entry)
    );
    const avgReturn =
      dailyReturns.length > 0
        ? dailyReturns.reduce((a, b) => a + b) / dailyReturns.length
        : 0;

    const variance = dailyReturns.length > 0
      ? dailyReturns.reduce(
          (sum, ret) => sum + Math.pow(ret - avgReturn, 2),
          0
        ) / dailyReturns.length
      : 0;

    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    return {
      totalReturn: Math.round(totalReturn * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      totalTrades: closedTrades.length,
      winningTrades,
      losingTrades,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      maxDrawdown: this.calculateMaxDrawdown(closedTrades),
    };
  }

  /**
   * Calculate maximum drawdown
   */
  calculateMaxDrawdown(trades) {
    let peak = 0;
    let maxDD = 0;

    trades.forEach((trade) => {
      const currentValue = trade.exit;
      if (currentValue > peak) {
        peak = currentValue;
      }

      const dd = ((peak - currentValue) / peak) * 100;
      if (dd > maxDD) {
        maxDD = dd;
      }
    });

    return Math.round(maxDD * 100) / 100;
  }

  /**
   * Helper: Period to days
   */
  periodToDays(period) {
    const mapping = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
    };

    return mapping[period] || 90;
  }

  /**
   * Helper: Map symbol to CoinGecko ID
   */
  mapSymbolToCoinId(symbol) {
    const mapping = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      XRP: 'ripple',
      ADA: 'cardano',
    };

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Helper: Calculate SMA
   */
  calculateSMA(prices, period) {
    const result = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const sum = prices
          .slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }

    return result;
  }

  /**
   * Helper: Calculate RSI
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period) return 50;

    let gains = 0,
      losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    const rs = avgGain / avgLoss;
    return Math.round(100 - 100 / (1 + rs));
  }

  /**
   * Helper: Calculate volatility
   */
  calculateVolatility(prices) {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * 100;
  }
}

export default new BacktestEngine();
