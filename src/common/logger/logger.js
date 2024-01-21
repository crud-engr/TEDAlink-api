const pino = require('pino');
const dayjs = require('dayjs');

const log = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
    base: {
        pid: false,
    },
    timestamp: () => `,"time":"${dayjs().format()}"`,
});

module.exports = log;
