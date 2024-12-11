export function useGeinsLog(scope: string = '') {
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
