const winston = require('winston');

// Set up the logger
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.splat(),
        winston.format.printf((debug) => {
            const { timestamp, level, message, ...args } = debug;
            return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`.toString();
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/warn.log', level: 'warn' }),
        new winston.transports.File({ filename: 'logs/debug.log', level: 'debug' }),
        // Add other log files as needed
    ],
});

// Add a console transport for 'info' level only
logger.add(new winston.transports.Console({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.cli(),
        winston.format.errors({ stack: true }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.splat(),
        winston.format.printf((debug) => {
            const { timestamp, level, message, ...args } = debug;
            return `|log ${level} ${timestamp}| -> ${message.trim()} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
        })
    ),
}));

module.exports = logger;