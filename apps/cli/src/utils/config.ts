import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  apiUrl: string;
  apiKey: string | undefined;
  format: 'json' | 'yaml' | 'table';
  verbose: boolean;
}

export const defaultConfig: Config = {
  apiUrl: process.env.FIRECRAWL_API_URL || 'http://localhost:3002',
  apiKey: process.env.FIRECRAWL_API_KEY,
  format: (process.env.FIRECRAWL_OUTPUT as Config['format']) || 'json',
  verbose: false,
};

export function getConfig(): Config {
  return { ...defaultConfig };
}
