/**
 * Custom hook to use Geins logging functions.
 *
 * @param {string} [scope=''] - The scope of the log messages.
 * @returns {Object} An object containing the logging functions:
 * - `geinsLog`: General log function.
 * - `geinsLogError`: Error log function.
 * - `geinsLogInfo`: Info log function.
 * - `geinsLogWarn`: Warning log function.
 */
export function useGeinsLog(scope: string = ''): object {
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
}
