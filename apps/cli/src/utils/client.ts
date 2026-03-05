import { Firecrawl } from '@mendable/firecrawl-js';
import { Config } from './config.js';

let client: Firecrawl | null = null;

export function getClient(config: Config): Firecrawl {
  if (!client) {
    client = new Firecrawl({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
    });
  }
  return client;
}
