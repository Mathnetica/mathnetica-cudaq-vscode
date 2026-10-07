import { runCurrentFile } from '../cudaq/runner';

export async function runFileCommand(): Promise<void> {
  await runCurrentFile();
}
