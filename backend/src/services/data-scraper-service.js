import axios from 'axios';
import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';

/**
 * Data Scraper Service
 * Fetches real-time market data from multiple sources
 * Includes crypto prices, technical indicators, volume, and on-chain metrics
 */

class DataScraperService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.browser = null;
  }

  /**
   * Get cached market data
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
   * Scrape market data for a ticker
   * Returns prices, technical indicators, volume, and on-chain data
   */
  async scrapeMarketData(ticker) {
    const cacheKey = `market_data_${ticker}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      logger.info(`Scraping market data for ${ticker}`);

      const marketData = {
        ticker,
        timestamp: new Date().toISOString(),
        price: null,
        priceHistory: [],
        technicalIndicators: {},
        volume: null,
        liquidity: null,
        onChainMetrics: null,
        errors: [],
      };

      // Get current price and volume
      try {
        const priceData = await this.fetchCryptoPrice(ticker);
        marketData.price = priceData.price;
        marketData.volume = priceData.volume;
        marketData.marketCap = priceData.marketCap;
        marketData.priceHistory = priceData.history || [];
      } catch (error) {
        marketData.errors.push(`Price fetch error: ${error.message}`);
      }

      // Calculate technical indicators
      try {
        marketData.technicalIndicators = await this.calculateTechnicalIndicators(
          ticker,
          marketData.priceHistory
        );
      } catch (error) {
        marketData.errors.push(`Technical indicators error: ${error.message}`);
      }

      // Get liquidity metrics
      try {
        marketData.liquidity = await this.analyzeLiquidity(ticker);
      } catch (error) {
        marketData.errors.push(`Liquidity analysis error: ${error.message}`);
      }

      // Get on-chain metrics if crypto
      try {
        marketData.onChainMetrics = await this.fetchOnChainMetrics(ticker);
      } catch (error) {
        marketData.errors.push(`On-chain metrics error: ${error.message}`);
      }

      this.setCache(cacheKey, marketData);
      logger.info(`Market data scrape complete for ${ticker}`);
      return marketData;
    } catch (error) {
      logger.error(`Error scraping market data for ${ticker}`, error);
      return {
        ticker,
        timestamp: new Date().toISOString(),
        price: null,
        errors: [error.message],
      };
    }
  }

  /**
   * Fetch crypto price and volume from CoinGecko
   */
  async fetchCryptoPrice(ticker) {
    try {
      const coinId = this.mapTickerToCoinId(ticker);

      // Get current price
      const priceResponse = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_ath=true&include_atl=true`,
        { timeout: 5000 }
      );

      const data = priceResponse.data[coinId];

      // Get historical data for technical analysis
      const historyResponse = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30`,
        { timeout: 5000 }
      );

      return {
        price: data.usd,
        marketCap: data.usd_market_cap,
        volume: data.usd_24h_vol,
        ath: data.ath?.usd,
        atl: data.atl?.usd,
        history: historyResponse.data.prices.map((p) => ({
          timestamp: p[0],
          price: p[1],
        })),
      };
    } catch (error) {
      logger.error(`Error fetching crypto price for ${ticker}`, error);
      throw error;
    }
  }

  /**
   * Calculate technical indicators from price history
   * RSI, MACD, Moving Averages
   */
  async calculateTechnicalIndicators(ticker, priceHistory) {
    try {
      const indicators = {
        rsi: null,
        macd: null,
        ema20: null,
        ema50: null,
        sma200: null,
        bollingerBands: null,
      };

      if (!priceHistory || priceHistory.length < 50) {
        return indicators;
      }

      const prices = priceHistory.map((p) => p.price).reverse();

      // RSI (14-period)
      indicators.rsi = this.calculateRSI(prices, 14);

      // Moving averages
      indicators.ema20 = this.calculateEMA(prices, 20);
      indicators.ema50 = this.calculateEMA(prices, 50);
      indicators.sma200 = this.calculateSMA(prices, 200);

      // MACD
      const ema12 = this.calculateEMA(prices, 12);
      const ema26 = this.calculateEMA(prices, 26);
      indicators.macd = {
        line: ema12 - ema26,
        signal: ema12 - ema26, // Simplified, would need signal line
      };

      // Bollinger Bands
      const sma = this.calculateSMA(prices, 20);
      const stdDev = this.calculateStdDev(prices.slice(0, 20));
      indicators.bollingerBands = {
        upper: sma + 2 * stdDev,
        middle: sma,
        lower: sma - 2 * stdDev,
      };

      return indicators;
    } catch (error) {
      logger.warn(`Error calculating technical indicators: ${error.message}`);
      return {};
    }
  }

  /**
   * Analyze liquidity metrics
   */
  async analyzeLiquidity(ticker) {
    try {
      const data = await this.fetchCryptoPrice(ticker);

      const liquidity = {
        volume24h: data.volume,
        volumeToMarketCap: data.marketCap ? (data.volume / data.marketCap) * 100 : 0,
        liquidityScore: 0,
        status: 'normal',
      };

      // Score liquidity
      const ratio = liquidity.volumeToMarketCap;
      if (ratio > 20) {
        liquidity.liquidityScore = 100;
        liquidity.status = 'excellent';
      } else if (ratio > 10) {
        liquidity.liquidityScore = 80;
        liquidity.status = 'good';
      } else if (ratio > 1) {
        liquidity.liquidityScore = 60;
        liquidity.status = 'normal';
      } else if (ratio > 0.1) {
        liquidity.liquidityScore = 30;
        liquidity.status = 'low';
      } else {
        liquidity.liquidityScore = 10;
        liquidity.status = 'very_low';
      }

      return liquidity;
    } catch (error) {
      logger.warn(`Error analyzing liquidity: ${error.message}`);
      return { liquidityScore: 0, status: 'unknown' };
    }
  }

  /**
   * Fetch on-chain metrics (for crypto)
   * Address activity, whale movements, transaction volume
   */
  async fetchOnChainMetrics(ticker) {
    try {
      // In production, this would fetch from Glassnode, IntoTheBlock, or similar
      // For now, return structure that can be filled with API data

      const metrics = {
        activeAddresses: null,
        transactionVolume: null,
        largeTransactions: null,
        whaleActivity: null,
        networkGrowth: null,
        timestamp: new Date().toISOString(),
      };

      // This would require specialized on-chain data APIs
      // Placeholder for integration

      return metrics;
    } catch (error) {
      logger.warn(`Error fetching on-chain metrics: ${error.message}`);
      return null;
    }
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
    };

    return mapping[ticker.toUpperCase()] || ticker.toLowerCase();
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period) return null;

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
    const rsi = 100 - 100 / (1 + rs);

    return Math.round(rsi);
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  calculateEMA(prices, period) {
    if (prices.length < period) return null;

    let ema = this.calculateSMA(prices.slice(0, period), period);

    const multiplier = 2 / (period + 1);

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return Math.round(ema * 100) / 100;
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  calculateSMA(prices, period) {
    if (prices.length < period) return null;

    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate Standard Deviation
   */
  calculateStdDev(values) {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Cleanup: Close browser if open
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default new DataScraperService();
