import { selectTarget } from '../cudaq/targets';

export async function selectTargetCommand(): Promise<string | undefined> {
  return selectTarget();
}
