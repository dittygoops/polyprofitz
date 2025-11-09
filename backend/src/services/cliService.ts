import { spawn } from 'child_process';
import path from 'path';
import { AppError } from '../middleware/errorHandler';

export class CLIService {
  private projectRoot: string;

  constructor() {
    // Backend is in backend/ directory, CLI is in parent directory
    this.projectRoot = path.resolve(__dirname, '../../..');
  }

  /**
   * Execute the CLI tool to fetch market data
   * Returns the path to the generated JSON file
   */
  async executeDataFetch(query: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`Executing CLI: fetch-event "${query}"`);

      // Escape double quotes in the query for shell safety
      const escapedQuery = query.replace(/"/g, '\\"');

      const cliProcess = spawn('npm', ['run', 'dev', '--', 'fetch-event', `"${escapedQuery}"`], {
        cwd: this.projectRoot,
        shell: true,
      });

      let stdout = '';
      let stderr = '';
      let jsonFilePath = '';

      cliProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`CLI stdout: ${output.trim()}`);

        // Extract JSON file path from output
        // Look for pattern: "Data saved successfully to: /full/path/to/file.json"
        const saveMatch = output.match(/Data saved successfully to: (.+\.json)/);
        if (saveMatch) {
          jsonFilePath = saveMatch[1].trim();
          console.log(`Found JSON file path: ${jsonFilePath}`);
        }
      });

      cliProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`CLI stderr: ${output.trim()}`);
      });

      cliProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`CLI process exited with code ${code}`);
          reject(new AppError(500, `CLI tool failed: ${stderr || 'Unknown error'}`));
          return;
        }

        if (!jsonFilePath) {
          reject(new AppError(500, 'CLI tool completed but no JSON file path was found in output'));
          return;
        }

        console.log(`CLI completed successfully. JSON file: ${jsonFilePath}`);
        resolve(jsonFilePath);
      });

      cliProcess.on('error', (error) => {
        console.error(`CLI process error: ${error.message}`);
        reject(new AppError(500, `Failed to execute CLI tool: ${error.message}`));
      });

      // Set timeout (60 seconds)
      setTimeout(() => {
        cliProcess.kill();
        reject(new AppError(500, 'CLI tool timed out after 60 seconds'));
      }, 60000);
    });
  }
}
