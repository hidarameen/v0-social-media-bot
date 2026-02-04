type LogFn = (...args: unknown[]) => void;

const isDev = process.env.NODE_ENV !== 'production';

const info: LogFn = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

const warn: LogFn = (...args) => {
  if (isDev) {
    console.warn(...args);
  }
};

const error: LogFn = (...args) => {
  console.error(...args);
};

const debug: LogFn = (...args) => {
  if (isDev) {
    console.debug(...args);
  }
};

export const logger = {
  info,
  warn,
  error,
  debug,
};
