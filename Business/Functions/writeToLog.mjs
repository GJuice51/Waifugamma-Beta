import fs from 'fs/promises';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFilePath = path.join(__dirname, 'gammaErrors.log');

export async function writeToLog(message) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    await fs.appendFile(logFilePath, logMessage);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}