const fs = require('fs');
const path = require('path');

/**
 * نظام Logger بسيط وفعال
 * يدعم الألوان والحفظ في ملفات
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[37m'
};

const logDir = path.join(process.cwd(), 'logs');

// التأكد من وجود مجلد logs
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getLogFile = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `sooq-${date}.log`);
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message) => {
  return `[${getTimestamp()}] [${level}] ${message}`;
};

const writeToFile = (message) => {
  try {
    const logFile = getLogFile();
    fs.appendFileSync(logFile, message + '\n', 'utf-8');
  } catch (error) {
    console.error('❌ خطأ في كتابة السجل:', error.message);
  }
};

const logger = {
  // معلومات عامة
  info: (message) => {
    const formatted = formatMessage('INFO', message);
    console.log(`${colors.blue}${formatted}${colors.reset}`);
    writeToFile(formatted);
  },

  // تحذيرات
  warn: (message) => {
    const formatted = formatMessage('WARN', message);
    console.log(`${colors.yellow}${formatted}${colors.reset}`);
    writeToFile(formatted);
  },

  // أخطاء
  error: (message) => {
    const formatted = formatMessage('ERROR', message);
    console.log(`${colors.red}${formatted}${colors.reset}`);
    writeToFile(formatted);
  },

  // نجاح
  success: (message) => {
    const formatted = formatMessage('SUCCESS', message);
    console.log(`${colors.green}${formatted}${colors.reset}`);
    writeToFile(formatted);
  },

  // معلومات مهمة
  important: (message) => {
    const formatted = formatMessage('IMPORTANT', message);
    console.log(`${colors.bright}${colors.magenta}${formatted}${colors.reset}`);
    writeToFile(formatted);
  },

  // معلومات تصحيح
  debug: (message) => {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      const formatted = formatMessage('DEBUG', message);
      console.log(`${colors.cyan}${formatted}${colors.reset}`);
      writeToFile(formatted);
    }
  }
};

module.exports = logger;