import winston, {format, Logger} from "winston";

let combinedFormat = winston.format.combine(
    format.splat(),
  );

const logger:Logger = winston.createLogger({
  level: 'silly',
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.Console({
      format: combinedFormat,
    }),
  ],
});

export default logger;
