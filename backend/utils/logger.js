export const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ℹ️  ${message}`, data ? JSON.stringify(data) : '');
  },
  
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${message}`, error ? error.message : '');
    if (error?.stack) {
      console.error(error.stack);
    }
  },
  
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️  ${message}`, data ? JSON.stringify(data) : '');
  },
  
  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ ${message}`, data ? JSON.stringify(data) : '');
  }
};

export default logger;
