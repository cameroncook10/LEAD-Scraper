/**
 * Trading Bot Configuration
 * All thresholds, API keys, and parameters
 */

export const tradingConfig = {
  // API Keys and Authentication
  apis: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-opus-4-20250514',
      maxTokens: 4096,
    },
    xai: {
      apiKey: process.env.XAI_API_KEY || '',
    },
  },

  // Decision Thresholds
  thresholds: {
    minConfidence: parseInt(process.env.MIN_CONFIDENCE || '60'),
    maxPositionSize: parseInt(process.env.MAX_POSITION_SIZE || '25'),
    maxPortfolioRisk: parseInt(process.env.MAX_PORTFOLIO_RISK || '10'),
    minMarketHealth: parseInt(process.env.MIN_MARKET_HEALTH || '50'),
  },

  // Risk Management
  risk: {
    defaultStopLoss: parseFloat(process.env.DEFAULT_STOP_LOSS || '5'),
    defaultTakeProfit: parseFloat(process.env.DEFAULT_TAKE_PROFIT || '15'),
    maxDrawdown: parseFloat(process.env.MAX_DRAWDOWN || '20'),
    positionSizingMethod: 'fixed', // 'fixed' or 'adaptive'
    fixedPositionSize: 0.05,
  },

  // Trading Parameters
  trading: {
    startCapital: parseFloat(process.env.START_CAPITAL || '10000'),
    paperTrading: process.env.PAPER_TRADING !== 'false', // Always paper until live decision
    autoExecute: process.env.AUTO_EXECUTE === 'true',
    watchlist: (process.env.WATCHLIST || 'BTC,ETH,SOL').split(','),
    analysisInterval: parseInt(process.env.ANALYSIS_INTERVAL || '3600000'), // 1 hour
  },

  // Data Sources
  dataSources: {
    priceData: 'coingecko', // 'coingecko', 'binance', 'kraken'
    marketResearch: 'web_search',
    sentiment: 'twitter_search',
    onChain: 'glassnode', // optional
  },

  // Cron Jobs
  cron: {
    analysisSchedule: process.env.ANALYSIS_CRON || '0 * * * *', // Every hour
    improvementSchedule: process.env.IMPROVEMENT_CRON || '0 */2 * * *', // Every 2 hours
    backtestSchedule: process.env.BACKTEST_CRON || '0 0 * * 0', // Weekly Sunday
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logsDir: process.env.LOGS_DIR || './logs',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
  },

  // Cache Configuration
  cache: {
    marketDataTTL: 5 * 60 * 1000, // 5 minutes
    sentimentTTL: 15 * 60 * 1000, // 15 minutes
    decisionTTL: 10 * 60 * 1000, // 10 minutes
  },

  // Database (optional)
  database: {
    enabled: process.env.DATABASE_ENABLED === 'true',
    type: process.env.DATABASE_TYPE || 'supabase',
    url: process.env.DATABASE_URL || '',
  },

  // Notifications
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
    channels: {
      email: process.env.EMAIL_ENABLED === 'true',
      discord: process.env.DISCORD_ENABLED === 'true',
      telegram: process.env.TELEGRAM_ENABLED === 'true',
    },
  },

  // Features
  features: {
    marketResearch: true,
    sentimentAnalysis: true,
    technicalAnalysis: true,
    onChainAnalysis: false,
    improvementAgent: true,
    backtesting: true,
  },

  // Safety Guards
  safety: {
    maxTradesPerDay: 10,
    minTimeBetweenTrades: 5 * 60 * 1000, // 5 minutes
    circuitBreaker: {
      enabled: true,
      consecutiveLosses: 3, // Stop after 3 consecutive losses
      dailyLossPercent: -10, // Stop if daily loss exceeds 10%
    },
    requireHumanApproval: {
      enabled: process.env.REQUIRE_APPROVAL === 'true',
      minConfidenceForAutoExec: 80,
    },
  },

  // Backtesting
  backtesting: {
    defaultPeriod: '90d',
    defaultCapital: 10000,
    slippagePercent: 0.1,
    commissionPercent: 0.05,
  },
};

// Validation
export function validateConfig() {
  const errors = [];

  if (!tradingConfig.apis.anthropic.apiKey) {
    errors.push('ANTHROPIC_API_KEY is required');
  }

  if (
    tradingConfig.thresholds.minConfidence < 0 ||
    tradingConfig.thresholds.minConfidence > 100
  ) {
    errors.push('MIN_CONFIDENCE must be between 0 and 100');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('Configuration validated successfully');
}

export default tradingConfig;
