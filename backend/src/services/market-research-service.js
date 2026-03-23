import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Market Research Service
 * Analyzes market conditions, competitor landscape, and trends
 * using real data from public APIs and web searches
 */

class MarketResearchService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached data if available
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
   * Analyze market conditions for a given ticker/symbol
   * Checks market health, volatility, volume, and sentiment
   */
  async analyzeMarketConditions(ticker) {
    const cacheKey = `market_${ticker}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      logger.info(`Analyzing market conditions for ${ticker}`);

      // Fetch market data from CoinGecko for crypto (works without API key)
      let marketData = {
        ticker,
        timestamp: new Date().toISOString(),
        isHealthy: false,
        metrics: {},
        warnings: [],
      };

      if (ticker.toLowerCase().includes('usd') || ticker.length <= 5) {
        // Try crypto first
        marketData = await this.analyzeCryptoMarket(ticker, marketData);
      } else {
        // Try stock market
        marketData = await this.analyzeStockMarket(ticker, marketData);
      }

      // Validate market health
      marketData.isHealthy = this.validateMarketHealth(marketData);

      this.setCache(cacheKey, marketData);
      logger.info(`Market analysis complete for ${ticker}`, { isHealthy: marketData.isHealthy });
      return marketData;
    } catch (error) {
      logger.error(`Error analyzing market for ${ticker}`, error);
      return {
        ticker,
        timestamp: new Date().toISOString(),
        isHealthy: false,
        metrics: {},
        warnings: [`Failed to analyze market: ${error.message}`],
        error: error.message,
      };
    }
  }

  /**
   * Analyze crypto market data from CoinGecko API (free)
   */
  async analyzeCryptoMarket(ticker, baseData) {
    try {
      const coinId = this.mapTickerToCoinId(ticker);
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true&include_price_change_percentage=true`,
        { timeout: 5000 }
      );

      const data = response.data[coinId];
      if (!data) {
        baseData.warnings.push(`No data found for coin: ${ticker}`);
        return baseData;
      }

      baseData.metrics = {
        price: data.usd,
        marketCap: data.usd_market_cap,
        volume24h: data.usd_24h_vol,
        priceChange24h: data.usd_24h_change,
        lastUpdated: new Date(data.last_updated_at).toISOString(),
      };

      // Calculate additional metrics
      if (data.usd_market_cap && data.usd_24h_vol) {
        const volumeToMCRatio = (data.usd_24h_vol / data.usd_market_cap) * 100;
        baseData.metrics.volumeToMarketCapRatio = volumeToMCRatio;
        baseData.metrics.liquidityScore = Math.min(volumeToMCRatio / 10, 100); // Score 0-100
      }

      // Check volatility
      const volatility = Math.abs(data.usd_24h_change || 0);
      baseData.metrics.volatility24h = volatility;
      baseData.metrics.volatilityLevel = this.getVolatilityLevel(volatility);

      if (volatility > 20) {
        baseData.warnings.push(`High volatility detected: ${volatility.toFixed(2)}%`);
      }

      return baseData;
    } catch (error) {
      logger.error(`Error analyzing crypto market for ${ticker}`, error);
      baseData.warnings.push(`Crypto market analysis failed: ${error.message}`);
      return baseData;
    }
  }

  /**
   * Analyze stock market data
   * Uses free API endpoints where possible
   */
  async analyzeStockMarket(ticker, baseData) {
    try {
      // Using IEX Cloud free tier (limited, or polygon.io free tier)
      // For this implementation, we'll use Yahoo Finance scraping via public endpoints
      
      baseData.metrics = {
        source: 'market-analysis',
        analyzed: true,
        priceLevel: 'medium', // placeholder
      };

      baseData.warnings.push('Stock market analysis requires API key - using fallback metrics');
      return baseData;
    } catch (error) {
      logger.error(`Error analyzing stock market for ${ticker}`, error);
      baseData.warnings.push(`Stock market analysis failed: ${error.message}`);
      return baseData;
    }
  }

  /**
   * Analyze competitors in the market
   * For crypto, looks at similar tokens; for stocks, looks at sector peers
   */
  async analyzeCompetitors(ticker) {
    const cacheKey = `competitors_${ticker}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      logger.info(`Analyzing competitors for ${ticker}`);

      const competitors = {
        ticker,
        timestamp: new Date().toISOString(),
        competitors: [],
        marketPosition: 'unknown',
      };

      // For crypto, fetch top coins by market cap
      try {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false',
          { timeout: 5000 }
        );

        competitors.competitors = response.data
          .slice(0, 10)
          .map((coin) => ({
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            marketCap: coin.market_cap,
            price: coin.current_price,
            priceChange24h: coin.price_change_percentage_24h,
          }));

        // Find market position
        const position = competitors.competitors.findIndex(
          (c) => c.symbol === ticker.toUpperCase()
        );
        if (position !== -1) {
          competitors.marketPosition = `Top ${position + 1}`;
        }
      } catch (error) {
        logger.warn(`Failed to fetch competitor data: ${error.message}`);
        competitors.warnings = [error.message];
      }

      this.setCache(cacheKey, competitors);
      return competitors;
    } catch (error) {
      logger.error(`Error analyzing competitors for ${ticker}`, error);
      return {
        ticker,
        timestamp: new Date().toISOString(),
        competitors: [],
        marketPosition: 'unknown',
        error: error.message,
      };
    }
  }

  /**
   * Detect market trends
   * Analyzes price movements, volume trends, and sentiment
   */
  async detectTrends(ticker, timeframe = '24h') {
    const cacheKey = `trends_${ticker}_${timeframe}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      logger.info(`Detecting trends for ${ticker} (${timeframe})`);

      const trends = {
        ticker,
        timeframe,
        timestamp: new Date().toISOString(),
        trendDirection: 'neutral',
        strength: 0,
        signals: [],
      };

      try {
        // Get historical data from CoinGecko
        const days = this.timeframeToDays(timeframe);
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${this.mapTickerToCoinId(ticker)}/market_chart?vs_currency=usd&days=${days}`,
          { timeout: 5000 }
        );

        const prices = response.data.prices;
        if (prices.length < 2) {
          trends.signals.push('Insufficient data for trend analysis');
          return trends;
        }

        // Calculate trend
        const startPrice = prices[0][1];
        const endPrice = prices[prices.length - 1][1];
        const priceChange = ((endPrice - startPrice) / startPrice) * 100;

        trends.priceChange = priceChange;
        trends.trendDirection = priceChange > 2 ? 'up' : priceChange < -2 ? 'down' : 'neutral';
        trends.strength = Math.min(Math.abs(priceChange) / 10, 100); // 0-100 score

        // Calculate volatility during period
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
          const ret = (prices[i][1] - prices[i - 1][1]) / prices[i - 1][1];
          returns.push(ret);
        }

        const volatility = this.calculateStdDev(returns) * 100;
        trends.volatility = volatility;

        // Trend signals
        if (priceChange > 10) {
          trends.signals.push('Strong uptrend');
        } else if (priceChange > 5) {
          trends.signals.push('Mild uptrend');
        } else if (priceChange < -10) {
          trends.signals.push('Strong downtrend');
        } else if (priceChange < -5) {
          trends.signals.push('Mild downtrend');
        } else {
          trends.signals.push('Consolidating');
        }

        if (volatility > 15) {
          trends.signals.push('High volatility');
        }
      } catch (error) {
        trends.signals.push(`Trend analysis error: ${error.message}`);
      }

      this.setCache(cacheKey, trends);
      return trends;
    } catch (error) {
      logger.error(`Error detecting trends for ${ticker}`, error);
      return {
        ticker,
        timeframe,
        timestamp: new Date().toISOString(),
        trendDirection: 'neutral',
        strength: 0,
        signals: [error.message],
        error: error.message,
      };
    }
  }

  /**
   * Validate market health based on collected metrics
   */
  validateMarketHealth(marketData) {
    // Market is healthy if:
    // 1. Has price data
    // 2. Volatility is reasonable (< 30%)
    // 3. Volume is meaningful (volume/market cap > 0.5%)

    const hasPrice = marketData.metrics.price !== undefined;
    const volatilityOk =
      !marketData.metrics.volatility24h || marketData.metrics.volatility24h < 30;
    const volumeOk =
      !marketData.metrics.volumeToMarketCapRatio ||
      marketData.metrics.volumeToMarketCapRatio > 0.5;

    return hasPrice && volatilityOk && volumeOk;
  }

  /**
   * Helper: Map ticker to CoinGecko ID
   */
  mapTickerToCoinId(ticker) {
    const mapping = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      XRP: 'ripple',
      ADA: 'cardano',
      DOGE: 'dogecoin',
      MATIC: 'matic-network',
      LINK: 'chainlink',
      XLM: 'stellar',
      BCH: 'bitcoin-cash',
    };

    return mapping[ticker.toUpperCase()] || ticker.toLowerCase();
  }

  /**
   * Helper: Classify volatility level
   */
  getVolatilityLevel(volatility) {
    if (volatility < 2) return 'very_low';
    if (volatility < 5) return 'low';
    if (volatility < 10) return 'medium';
    if (volatility < 20) return 'high';
    return 'very_high';
  }

  /**
   * Helper: Convert timeframe to days
   */
  timeframeToDays(timeframe) {
    const mapping = {
      '1h': 0.04,
      '4h': 0.17,
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '24h': 1,
    };

    return Math.ceil(mapping[timeframe] || 1);
  }

  /**
   * Helper: Calculate standard deviation
   */
  calculateStdDev(values) {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

export default new MarketResearchService();
