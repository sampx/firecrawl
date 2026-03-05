import chalk from 'chalk';

export interface AppError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function formatError(error: any): AppError {
  let code = 'UNKNOWN_ERROR';
  let message = error.message || 'An unknown error occurred';
  let details = error;

  if (error.response) {
    code = 'API_ERROR';
    message = error.response.data?.error || error.message;
    details = error.response.data;
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    code = 'NETWORK_ERROR';
    message = `Failed to connect to API: ${error.message}`;
  }

  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export function handleError(error: any, verbose = false) {
  const formattedError = formatError(error);
  if (verbose) {
    console.error(JSON.stringify(formattedError, null, 2));
  } else {
    console.error(chalk.red(`Error: [${formattedError.error.code}] ${formattedError.error.message}`));
  }
}
