/* eslint-disable @typescript-eslint/no-explicit-any */
interface GeinsLogger {
  geinsLog: (...args: any[]) => void;
  geinsLogError: (...args: any[]) => void;
  geinsLogInfo: (...args: any[]) => void;
  geinsLogWarn: (...args: any[]) => void;
}
/**
 * Custom hook to use Geins logging functions.
 *
 * @param {string} [scope=''] - The scope of the log messages.
 * @returns {GeinsLogger} An object containing the logging functions:
 * - `geinsLog`: General log function.
 * - `geinsLogError`: Error log function.
 * - `geinsLogInfo`: Info log function.
 * - `geinsLogWarn`: Warning log function.
 */
export const useGeinsLog = (scope: string = ''): GeinsLogger => {
  const config = useRuntimeConfig();
  const { geinsLog, geinsLogError, geinsLogInfo, geinsLogWarn } = log(
    scope,
    config.public.debug,
  );

  return {
    geinsLog,
    geinsLogError,
    geinsLogInfo,
    geinsLogWarn,
  };
};
