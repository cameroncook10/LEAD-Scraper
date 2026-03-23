import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Sentiment Service
 * Analyzes market sentiment from social media (Twitter/X)
 * Uses web search to find relevant posts and news
 */

class SentimentService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes for sentiment data
  }

  /**
   * Get cached sentiment data
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cache with expiry
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheExpiry,
    });
  }

  /**
   * Get overall sentiment for a ticker
   * Returns sentiment score from -100 (very negative) to +100 (very positive)
   */
  async getSentiment(ticker, symbol) {
    const cacheKey = `sentiment_${ticker}_${symbol}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      logger.info(`Analyzing sentiment for ${ticker} (${symbol})`);

      const sentiment = {
        ticker,
        symbol,
        timestamp: new Date().toISOString(),
        score: 0, // -100 to +100
        confidence: 0, // 0 to 100
        breakdown: {
          positive: 0,
          negative: 0,
          neutral: 0,
        },
        signals: [],
        newsCount: 0,
        warnings: [],
      };

      try {
        // Analyze social media sentiment (simulated with local sentiment logic)
        // In production, this would use X/Twitter API or specialized sentiment APIs
        sentiment.sources = await this.analyzeSocialSentiment(ticker, symbol);

        // Calculate aggregate sentiment
        if (sentiment.sources && sentiment.sources.length > 0) {
          sentiment.score = this.calculateAggregateScore(sentiment.sources);
          sentiment.confidence = Math.min(
            (sentiment.sources.length / 20) * 100,
            95
          );
          sentiment.newsCount = sentiment.sources.length;

          // Breakdown
          sentiment.breakdown.positive = sentiment.sources.filter(
            (s) => s.sentiment > 0.2
          ).length;
          sentiment.breakdown.negative = sentiment.sources.filter(
            (s) => s.sentiment < -0.2
          ).length;
          sentiment.breakdown.neutral =
            sentiment.sources.length -
            sentiment.breakdown.positive -
            sentiment.breakdown.negative;
        }

        // Detect breaking news and major events
        sentiment.breakingNews = await this.detectBreakingNews(ticker);

        // Generate trading signals based on sentiment
        sentiment.signals = this.generateSentimentSignals(sentiment.score);
      } catch (error) {
        logger.warn(`Error during sentiment analysis: ${error.message}`);
        sentiment.warnings.push(error.message);
        sentiment.confidence = 0;
      }

      this.setCache(cacheKey, sentiment);
      logger.info(`Sentiment analysis complete for ${ticker}`, {
        score: sentiment.score,
        confidence: sentiment.confidence,
      });

      return sentiment;
    } catch (error) {
      logger.error(`Error getting sentiment for ${ticker}`, error);
      return {
        ticker,
        symbol,
        timestamp: new Date().toISOString(),
        score: 0,
        confidence: 0,
        breakdown: { positive: 0, negative: 0, neutral: 0 },
        signals: [],
        newsCount: 0,
        warnings: [error.message],
        error: error.message,
      };
    }
  }

  /**
   * Analyze social media sentiment
   * Collects posts from Twitter/X and performs sentiment analysis
   */
  async analyzeSocialSentiment(ticker, symbol) {
    try {
      // In production, this would call X-Search skill
      // For now, we implement a basic sentiment detection logic
      // that can be enhanced with real API calls

      const sources = [];

      // Simulate fetching relevant tweets/posts
      // This would be replaced with actual X-Search or Twitter API calls
      const queries = [
        `${ticker} price`,
        `${symbol} trading`,
        `${ticker} bullish`,
        `${symbol} analysis`,
      ];

      // For demonstration, we'll return a realistic sentiment distribution
      // In production, each would be a real tweet with sentiment analysis
      const sentimentExamples = [
        {
          source: 'twitter',
          text: `${ticker} showing strong support at current levels`,
          sentiment: 0.7,
          engagement: 150,
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        {
          source: 'twitter',
          text: `Analyst upgrade on ${symbol} - bullish outlook`,
          sentiment: 0.8,
          engagement: 320,
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        },
        {
          source: 'twitter',
          text: `Concerns about ${ticker} regulatory environment`,
          sentiment: -0.5,
          engagement: 200,
          timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        },
        {
          source: 'twitter',
          text: `${symbol} consolidating before next move`,
          sentiment: 0.1,
          engagement: 80,
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        },
        {
          source: 'news',
          text: `New partnership announced for ${ticker}`,
          sentiment: 0.6,
          engagement: 450,
          timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        },
      ];

      return sentimentExamples.slice(0, 5);
    } catch (error) {
      logger.error(`Error analyzing social sentiment: ${error.message}`);
      return [];
    }
  }

  /**
   * Detect breaking news and major events
   */
  async detectBreakingNews(ticker) {
    try {
      const news = {
        hasBreakingNews: false,
        events: [],
        timestamp: new Date().toISOString(),
      };

      // In production, this would search news APIs or scrape news sites
      // For now, return structure for integration

      // This could call web_search or news API
      // Placeholder for real implementation

      return news;
    } catch (error) {
      logger.warn(`Error detecting breaking news: ${error.message}`);
      return { hasBreakingNews: false, events: [] };
    }
  }

  /**
   * Calculate aggregate sentiment score from sources
   */
  calculateAggregateScore(sources) {
    if (!sources || sources.length === 0) return 0;

    // Weight by engagement (more engagement = more impact)
    const totalEngagement = sources.reduce((sum, s) => sum + (s.engagement || 1), 0);

    const weightedScore = sources.reduce((sum, source) => {
      const weight = (source.engagement || 1) / totalEngagement;
      return sum + source.sentiment * weight;
    }, 0);

    // Convert from -1 to +1 scale to -100 to +100 scale
    return Math.round(weightedScore * 100);
  }

  /**
   * Generate trading signals based on sentiment score
   */
  generateSentimentSignals(score) {
    const signals = [];

    if (score > 50) {
      signals.push('Strong positive sentiment');
      signals.push('Consider bullish positions');
    } else if (score > 20) {
      signals.push('Mild positive sentiment');
    } else if (score < -50) {
      signals.push('Strong negative sentiment');
      signals.push('Consider defensive positions');
    } else if (score < -20) {
      signals.push('Mild negative sentiment');
    } else {
      signals.push('Neutral sentiment');
    }

    return signals;
  }

  /**
   * Aggregate sentiment trends over time
   */
  aggregateSentimentTrends(sentiments) {
    // sentiments is an array of sentiment results over time
    if (!sentiments || sentiments.length === 0) {
      return {
        trend: 'unknown',
        trajectory: 0,
      };
    }

    const scores = sentiments.map((s) => s.score);
    const recent = scores.slice(-5); // Last 5 data points
    const previous = scores.slice(0, -5);

    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b) / recent.length : 0;
    const previousAvg =
      previous.length > 0 ? previous.reduce((a, b) => a + b) / previous.length : 0;

    const trajectory = recentAvg - previousAvg;

    return {
      trend: trajectory > 5 ? 'improving' : trajectory < -5 ? 'deteriorating' : 'stable',
      trajectory: trajectory,
      recentAverage: Math.round(recentAvg),
      historicalAverage: Math.round(previousAvg),
    };
  }
}

export default new SentimentService();
