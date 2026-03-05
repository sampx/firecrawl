import yaml from 'js-yaml';
import Table from 'cli-table3';
import { Config } from './config.js';
import fs from 'fs';

export function formatOutput(data: any, format: Config['format']): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'yaml') {
    return yaml.dump(data);
  } else if (format === 'table') {
    if (Array.isArray(data)) {
      if (data.length === 0) return 'No data';
      const head = Object.keys(data[0]);
      const table = new Table({ head });
      data.forEach(item => {
        table.push(Object.values(item).map(v => typeof v === 'object' ? JSON.stringify(v) : v));
      });
      return table.toString();
    } else {
      const table = new Table();
      Object.entries(data).forEach(([key, value]) => {
        table.push({ [key]: typeof value === 'object' ? JSON.stringify(value) : value });
      });
      return table.toString();
    }
  }
  return String(data);
}

export function handleOutput(data: any, config: Config, outputFile?: string) {
  const output = formatOutput(data, config.format);
  if (outputFile) {
    fs.writeFileSync(outputFile, output);
    if (config.verbose) console.log(`Output saved to ${outputFile}`);
  } else {
    console.log(output);
  }
}
