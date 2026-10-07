import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

async function main(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 10000 });

  const files = await glob('**/**.test.js', { cwd: path.resolve(__dirname, './suite') });
  files.forEach((f) => mocha.addFile(path.resolve(__dirname, './suite', f)));

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
