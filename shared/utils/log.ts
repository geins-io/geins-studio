/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk';
import type { LogMethod, GeinsLogger } from '#shared/types';

/**
 * Utility to log messages with a Geins tag
 *
 * @returns Four logger functions: `geinsLog`, `geinsLogWarn`, `geinsLogError`, and `geinsLogInfo`
 */
export function log(scope?: string, debug: boolean = false): GeinsLogger {
  if (import.meta.nitro || import.meta.server) {
    debug = import.meta.env.GEINS_DEBUG === 'true';
  }
  const logTag = '%cgeins';
  const logStyle =
    'background-color: #e8452c; color: #FFFFFF; padding: 2px 8px; border-radius: 5px; font-weight:bold; letter-spacing:0.2em; font-size:1.1em; margin-right:5px;';

  const createLogger = (method: LogMethod, alwaysLog: boolean = false) => {
    return (message: any, ...args: any[]) => {
      if (!alwaysLog && !debug) {
        return;
      }
      let formattedMessage = scope ? `${scope} ::: ${message}` : message;
      if (import.meta.nitro || import.meta.server) {
        formattedMessage = scope
          ? `${chalk.bold.bgBlack(scope)} ::: ${message}`
          : message;
        console[method](
          `${chalk.bgWhite.bold.red(' geins ')} ${formattedMessage}`,
          ...args,
        );
      } else {
        console[method](logTag, logStyle, formattedMessage, ...args);
      }
    };
  };

  const geinsLog = createLogger('log');
  const geinsLogWarn = createLogger('warn', true);
  const geinsLogError = createLogger('error', true);
  const geinsLogInfo = createLogger('info', true);
  return {
    /**
     * Function to log a message when debug is enabled
     */
    geinsLog,
    /**
     * Function to log a warning message
     */
    geinsLogWarn,
    /**
     * Function to log an error message
     */
    geinsLogError,
    /**
     * Function to log an info message
     */
    geinsLogInfo,
  };
}
