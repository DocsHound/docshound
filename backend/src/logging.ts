import winston, { format } from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'docshound-backend' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  const simpleFormat = format.simple();
  const MESSAGE = Symbol.for('message');
  const simpleTimestamp = format((info) => {
    // Move timestamp and service out.
    const { timestamp, service, ...rest } = info;
    const simpled = simpleFormat.transform(rest);
    if (typeof simpled !== 'boolean') {
      // @ts-ignore
      simpled[MESSAGE] = `[${service}] ${timestamp} ${simpled[MESSAGE]}`;
    }
    return simpled;
  });
  logger.add(
    new winston.transports.Console({
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.colorize(),
        simpleTimestamp()
      ),
    })
  );
}
