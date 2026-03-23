import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Improvement Agent
 * Runs periodically (every 2 hours) to analyze recent trading performance
 * Extracts lessons, refines parameters, and updates decision prompts
 */

class ImprovementAgent {
  constructor(logsDir = './logs') {
    this.logsDir = logsDir;
    this.improvementHistoryPath = path.join(logsDir, 'improvement-history.json');
    this.decisionHistoryPath = path.join(logsDir, 'decision-history.json');
    this.tradeHistoryPath = path.join(logsDir, 'trade-history.json');
    this.ensureLogsDirectory();
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Run improvement analysis
   * Called by cron job every 2 hours
   */
  async analyze() {
    try {
      logger.info('Starting improvement analysis cycle');

      const startTime = Date.now();

      // 1. Load recent decisions and trades
      const decisions = this.loadRecentDecisions(24); // Last 24 hours
      const trades = this.loadRecentTrades(24);

      // 2. Calculate performance metrics
      const metrics = this.calculatePerformanceMetrics(decisions, trades);

      // 3. Extract improvement insights
      const insights = this.extractInsights(decisions, trades, metrics);

      // 4. Analyze decision accuracy by confidence level
      const confidenceCalibration = this.analyzeConfidenceCalibration(decisions, trades);

      // 5. Identify trending symbols and strategies
      const trendingPatterns = this.identifyPatterns(decisions, trades);

      // 6. Generate improvement recommendations
      const recommendations = this.generateRecommendations(
        metrics,
        insights,
        confidenceCalibration,
        trendingPatterns
      );

      // 7. Store improvement history
      const improvement = {
        timestamp: new Date().toISOString(),
        analysisWindow: '24h',
        metricsSnapshot: metrics,
        insights,
        confidenceCalibration,
        trendingPatterns,
        recommendations,
        durationMs: Date.now() - startTime,
      };

      this.saveImprovementHistory(improvement);

      logger.info('Improvement analysis complete', {
        decisionsAnalyzed: decisions.length,
        tradesAnalyzed: trades.length,
        ...metrics,
      });

      return improvement;
    } catch (error) {
      logger.error('Error in improvement analysis', error);
      return null;
    }
  }

  /**
   * Load recent decision records
   */
  loadRecentDecisions(hoursBack) {
    try {
      if (!fs.existsSync(this.decisionHistoryPath)) {
        return [];
      }

      const data = JSON.parse(fs.readFileSync(this.decisionHistoryPath, 'utf8'));
      const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

      return Array.isArray(data)
        ? data.filter((d) => new Date(d.timestamp).getTime() > cutoff)
        : [];
    } catch (error) {
      logger.warn(`Could not load decision history: ${error.message}`);
      return [];
    }
  }

  /**
   * Load recent trade records
   */
  loadRecentTrades(hoursBack) {
    try {
      if (!fs.existsSync(this.tradeHistoryPath)) {
        return [];
      }

      const data = JSON.parse(fs.readFileSync(this.tradeHistoryPath, 'utf8'));
      const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

      return Array.isArray(data)
        ? data.filter((t) => new Date(t.timestamp).getTime() > cutoff)
        : [];
    } catch (error) {
      logger.warn(`Could not load trade history: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(decisions, trades) {
    const metrics = {
      totalDecisions: decisions.length,
      totalTrades: trades.length,
      executedTrades: trades.filter((t) => t.executed).length,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      totalPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      winRate: 0,
      profitFactor: 0,
      avgConfidence: 0,
      avgHoldTime: 0,
    };

    if (trades.length === 0) {
      return metrics;
    }

    // Count wins/losses
    const closedTrades = trades.filter((t) => t.exitPrice !== undefined);

    closedTrades.forEach((trade) => {
      const pnlPercent =
        ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
      metrics.totalPnL += pnlPercent;

      if (pnlPercent > 0.1) {
        metrics.winningTrades++;
        metrics.avgWin += pnlPercent;
      } else if (pnlPercent < -0.1) {
        metrics.losingTrades++;
        metrics.avgLoss += pnlPercent;
      } else {
        metrics.breakEvenTrades++;
      }

      // Hold time
      if (trade.exitTime && trade.timestamp) {
        const holdMs =
          new Date(trade.exitTime).getTime() - new Date(trade.timestamp).getTime();
        metrics.avgHoldTime += holdMs;
      }
    });

    // Calculate averages
    if (metrics.winningTrades > 0) {
      metrics.avgWin /= metrics.winningTrades;
    }
    if (metrics.losingTrades > 0) {
      metrics.avgLoss /= metrics.losingTrades;
    }

    if (closedTrades.length > 0) {
      metrics.winRate = (metrics.winningTrades / closedTrades.length) * 100;
      metrics.avgHoldTime /= closedTrades.length;
    }

    // Profit factor
    if (metrics.avgLoss !== 0) {
      metrics.profitFactor = Math.abs(metrics.avgWin / metrics.avgLoss);
    }

    // Average confidence of executed trades
    const executedDecisions = decisions.filter((d) => d.shouldExecute);
    if (executedDecisions.length > 0) {
      metrics.avgConfidence =
        executedDecisions.reduce((sum, d) => sum + d.confidence, 0) /
        executedDecisions.length;
    }

    return metrics;
  }

  /**
   * Extract insights from performance
   */
  extractInsights(decisions, trades, metrics) {
    const insights = {
      observations: [],
      strengths: [],
      weaknesses: [],
      opportunities: [],
    };

    // Win rate analysis
    if (metrics.winRate > 60) {
      insights.strengths.push('High win rate - strategy is working well');
    } else if (metrics.winRate < 40) {
      insights.weaknesses.push('Low win rate - consider revising decision criteria');
    }

    // Profit factor analysis
    if (metrics.profitFactor > 2) {
      insights.strengths.push('Excellent profit factor - wins are large relative to losses');
    } else if (metrics.profitFactor < 0.5) {
      insights.weaknesses.push('Poor profit factor - losses exceed wins');
    }

    // Confidence calibration
    const highConfidenceDecisions = decisions.filter((d) => d.confidence >= 75);
    const highConfidenceAccuracy =
      highConfidenceDecisions.filter((d) => d.wasCorrect).length /
      Math.max(highConfidenceDecisions.length, 1);

    if (highConfidenceAccuracy > 0.7) {
      insights.strengths.push('Good confidence calibration at 75+ level');
    } else if (highConfidenceDecisions.length > 10) {
      insights.weaknesses.push('Overconfident at 75+ level - outcomes not matching confidence');
    }

    // Symbol-specific insights
    const symbolStats = this.analyzeBySymbol(trades);
    const bestSymbol = Object.entries(symbolStats).reduce((best, [sym, stats]) =>
      stats.winRate > best.stats.winRate ? { sym, stats } : best
    );

    if (bestSymbol && bestSymbol.stats.trades > 5) {
      insights.observations.push(
        `${bestSymbol.sym} has best performance (${bestSymbol.stats.winRate.toFixed(1)}% win rate)`
      );
    }

    // Opportunities
    if (metrics.totalDecisions > 50 && metrics.winRate > 50) {
      insights.opportunities.push('Consider increasing position sizes for high-confidence trades');
    }

    if (metrics.avgHoldTime > 0) {
      const holdHours = metrics.avgHoldTime / (60 * 60 * 1000);
      insights.observations.push(`Average hold time: ${holdHours.toFixed(1)} hours`);
    }

    return insights;
  }

  /**
   * Analyze decision accuracy by confidence level
   */
  analyzeConfidenceCalibration(decisions, trades) {
    const calibration = {
      buckets: [],
      overallAccuracy: 0,
    };

    const buckets = [
      { min: 0, max: 40 },
      { min: 40, max: 60 },
      { min: 60, max: 75 },
      { min: 75, max: 90 },
      { min: 90, max: 100 },
    ];

    buckets.forEach((bucket) => {
      const bucketed = decisions.filter(
        (d) => d.confidence >= bucket.min && d.confidence <= bucket.max
      );

      const correct = bucketed.filter((d) => d.wasCorrect).length;
      const accuracy = bucketed.length > 0 ? (correct / bucketed.length) * 100 : 0;

      calibration.buckets.push({
        range: `${bucket.min}-${bucket.max}%`,
        count: bucketed.length,
        accuracy: accuracy.toFixed(1),
        recommendation:
          accuracy > bucket.min ? 'Good calibration' : 'May be underestimating uncertainty',
      });
    });

    // Overall accuracy
    const correct = decisions.filter((d) => d.wasCorrect).length;
    calibration.overallAccuracy = decisions.length > 0 ? (correct / decisions.length) * 100 : 0;

    return calibration;
  }

  /**
   * Identify trending patterns
   */
  identifyPatterns(decisions, trades) {
    return {
      bestSymbols: this.identifyBestSymbols(trades),
      worstSymbols: this.identifyWorstSymbols(trades),
      timeOfDayPatterns: this.analyzeTimeOfDayPatterns(trades),
      sentimentCorrelation: this.analyzeSentimentCorrelation(decisions, trades),
    };
  }

  /**
   * Identify best performing symbols
   */
  identifyBestSymbols(trades) {
    const symbols = {};

    trades.forEach((trade) => {
      if (!symbols[trade.symbol]) {
        symbols[trade.symbol] = { trades: 0, wins: 0, totalPnL: 0 };
      }

      symbols[trade.symbol].trades++;
      if (trade.exitPrice && trade.exitPrice > trade.entryPrice) {
        symbols[trade.symbol].wins++;
      }
      if (trade.pnl) {
        symbols[trade.symbol].totalPnL += trade.pnl;
      }
    });

    return Object.entries(symbols)
      .map(([symbol, stats]) => ({
        symbol,
        trades: stats.trades,
        winRate: (stats.wins / stats.trades) * 100,
        totalPnL: stats.totalPnL,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);
  }

  /**
   * Identify worst performing symbols
   */
  identifyWorstSymbols(trades) {
    const symbols = {};

    trades.forEach((trade) => {
      if (!symbols[trade.symbol]) {
        symbols[trade.symbol] = { trades: 0, wins: 0, totalPnL: 0 };
      }

      symbols[trade.symbol].trades++;
      if (trade.exitPrice && trade.exitPrice > trade.entryPrice) {
        symbols[trade.symbol].wins++;
      }
      if (trade.pnl) {
        symbols[trade.symbol].totalPnL += trade.pnl;
      }
    });

    return Object.entries(symbols)
      .map(([symbol, stats]) => ({
        symbol,
        trades: stats.trades,
        winRate: (stats.wins / stats.trades) * 100,
        totalPnL: stats.totalPnL,
      }))
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 3);
  }

  /**
   * Analyze time of day patterns
   */
  analyzeTimeOfDayPatterns(trades) {
    const timePatterns = {};

    trades.forEach((trade) => {
      const hour = new Date(trade.timestamp).getHours();
      if (!timePatterns[hour]) {
        timePatterns[hour] = { trades: 0, wins: 0 };
      }
      timePatterns[hour].trades++;
      if (trade.exitPrice && trade.exitPrice > trade.entryPrice) {
        timePatterns[hour].wins++;
      }
    });

    return Object.entries(timePatterns).map(([hour, stats]) => ({
      hour: `${hour}:00`,
      trades: stats.trades,
      winRate: (stats.wins / stats.trades) * 100,
    }));
  }

  /**
   * Analyze sentiment correlation with trade outcomes
   */
  analyzeSentimentCorrelation(decisions, trades) {
    const sentimentBuckets = {
      veryNegative: { count: 0, wins: 0 }, // < -50
      negative: { count: 0, wins: 0 }, // -50 to -20
      neutral: { count: 0, wins: 0 }, // -20 to 20
      positive: { count: 0, wins: 0 }, // 20 to 50
      veryPositive: { count: 0, wins: 0 }, // > 50
    };

    decisions.forEach((decision) => {
      const sentiment = decision.sentiment || 0;
      let bucket = 'neutral';

      if (sentiment < -50) bucket = 'veryNegative';
      else if (sentiment < -20) bucket = 'negative';
      else if (sentiment > 50) bucket = 'veryPositive';
      else if (sentiment > 20) bucket = 'positive';

      sentimentBuckets[bucket].count++;
      if (decision.wasCorrect) {
        sentimentBuckets[bucket].wins++;
      }
    });

    return Object.entries(sentimentBuckets).map(([range, data]) => ({
      range,
      count: data.count,
      accuracy: data.count > 0 ? (data.wins / data.count) * 100 : 0,
    }));
  }

  /**
   * Analyze metrics by symbol
   */
  analyzeBySymbol(trades) {
    const symbols = {};

    trades.forEach((trade) => {
      if (!symbols[trade.symbol]) {
        symbols[trade.symbol] = { trades: 0, wins: 0 };
      }
      symbols[trade.symbol].trades++;
      if (trade.exitPrice && trade.exitPrice > trade.entryPrice) {
        symbols[trade.symbol].wins++;
      }
    });

    return Object.entries(symbols).reduce(
      (acc, [symbol, stats]) => ({
        ...acc,
        [symbol]: {
          trades: stats.trades,
          winRate: (stats.wins / stats.trades) * 100,
        },
      }),
      {}
    );
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(metrics, insights, calibration, patterns) {
    const recommendations = {
      trading: [],
      riskManagement: [],
      decisioning: [],
      focus: [],
    };

    // Trading recommendations
    if (metrics.winRate > 55) {
      recommendations.trading.push('Increase capital allocation slightly - strategy is working');
    } else if (metrics.winRate < 45) {
      recommendations.trading.push('Reduce capital allocation until improvements are made');
    }

    if (metrics.profitFactor < 1) {
      recommendations.trading.push('Review stop-loss levels - losses are too large');
    }

    // Risk management
    if (metrics.avgHoldTime > 12 * 60 * 60 * 1000) {
      recommendations.riskManagement.push('Consider tighter take-profit levels - holding too long');
    }

    // Decision improvements
    if (calibration.overallAccuracy < 50) {
      recommendations.decisioning.push('Review confidence threshold - current criteria not reliable');
    }

    if (patterns.bestSymbols && patterns.bestSymbols.length > 0) {
      recommendations.focus.push(
        `Focus on ${patterns.bestSymbols[0].symbol} - historically best performer`
      );
    }

    return recommendations;
  }

  /**
   * Save improvement history
   */
  saveImprovementHistory(improvement) {
    try {
      let history = [];

      if (fs.existsSync(this.improvementHistoryPath)) {
        history = JSON.parse(fs.readFileSync(this.improvementHistoryPath, 'utf8'));
      }

      history.push(improvement);

      // Keep last 100 entries
      if (history.length > 100) {
        history = history.slice(-100);
      }

      fs.writeFileSync(this.improvementHistoryPath, JSON.stringify(history, null, 2));
      logger.info('Improvement history saved');
    } catch (error) {
      logger.error('Error saving improvement history', error);
    }
  }
}

export default new ImprovementAgent();
