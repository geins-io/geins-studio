/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GeinsLogger {
  geinsLog: (...args: any[]) => void;
  geinsLogError: (...args: any[]) => void;
  geinsLogInfo: (...args: any[]) => void;
  geinsLogWarn: (...args: any[]) => void;
}

export type LogMethod = 'log' | 'warn' | 'error' | 'info';
