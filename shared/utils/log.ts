/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import chalk from 'chalk';
import { toRaw, isRef, isReactive } from 'vue';
import type { LogMethod, GeinsLogger } from '../types';

/**
 * Utility to log messages with a Geins tag
 *
 * @returns Four logger functions: `geinsLog`, `geinsLogWarn`, `geinsLogError`, and `geinsLogInfo`
 */
export function log(scope?: string, debug: boolean = false): GeinsLogger {
  if (import.meta.nitro || import.meta.server) {
    debug = process.env.GEINS_DEBUG === 'true';
  }
  const logTag = '%cgeins';
  const logStyle =
    'background-color: #e8452c; color: #FFFFFF; padding: 2px 8px; border-radius: 5px; font-weight:bold; letter-spacing:0.2em; font-size:1.1em; margin-right:5px;';

  const createLogger = (method: LogMethod, alwaysLog: boolean = false) => {
    return (message: any, ...args: any[]) => {
      // Unwrap reactive Vue objects before stringifying to avoid reactivity warnings
      const processedArgs = args.map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          // Handle Vue refs and reactive objects
          let rawArg = arg;
          if (isRef(arg)) {
            rawArg = arg.value;
          }
          if (isReactive(arg) || isReactive(rawArg)) {
            rawArg = toRaw(rawArg);
          }
          try {
            return JSON.parse(JSON.stringify(rawArg));
          } catch {
            // If stringify fails (circular reference, etc.), return the raw value
            return rawArg;
          }
        }
        return arg;
      });
      if (!alwaysLog && !debug) {
        return;
      }
      const timestamp = new Date().toLocaleTimeString();
      let formattedMessage = `${timestamp} ::: `;
      formattedMessage += scope ? `${scope} ::: ${message}` : message;
      if (import.meta.nitro || import.meta.server) {
        formattedMessage = `${chalk.grey(timestamp)} ::: `;
        formattedMessage += scope
          ? `${chalk.bold.bgBlack(scope)} ::: ${message}`
          : message;
        (console[method] as (...args: unknown[]) => void)(
          `${chalk.bgWhite.bold.red(' geins ')} ${formattedMessage}`,
          ...processedArgs,
        );
      } else {
        (console[method] as (...args: unknown[]) => void)(
          logTag,
          logStyle,
          formattedMessage,
          ...processedArgs,
        );
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
