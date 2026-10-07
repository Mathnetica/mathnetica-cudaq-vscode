import * as vscode from 'vscode';
import { runPythonScript, getPythonExecutable } from '../utils/python';
import { normalizeTargetName } from './targetName';

export { normalizeTargetName };

const TARGETS_SCRIPT = `
try:
    import cudaq
    targets = cudaq.get_targets()
    for t in targets:
        name = getattr(t, "name", None)
        if not name:
            parts = str(t).strip().split()
            # str(t) looks like "Target qpp-cpu\\n\\tsimulator=..."
            name = parts[1] if len(parts) > 1 and parts[0] == "Target" else parts[0]
        print(f"TARGET:{name}")
except Exception as e:
    print(f"ERROR:{e}")
`;

export async function discoverTargets(): Promise<string[]> {
  const pythonPath = (await getPythonExecutable()) ?? 'python3';

  try {
    const result = await runPythonScript(pythonPath, TARGETS_SCRIPT);
    if (result.exitCode !== 0) {
      return [];
    }

    const targets: string[] = [];
    for (const line of result.stdout.split('\n')) {
      if (line.startsWith('TARGET:')) {
        const name = normalizeTargetName(line.replace('TARGET:', ''));
        if (name && !targets.includes(name)) {
          targets.push(name);
        }
      }
    }
    return targets;
  } catch {
    return [];
  }
}

export function getSelectedTarget(): string {
  const config = vscode.workspace.getConfiguration('mathnetica.cudaq');
  return normalizeTargetName(config.get<string>('target', ''));
}

export async function setSelectedTarget(target: string): Promise<void> {
  const config = vscode.workspace.getConfiguration('mathnetica.cudaq');
  await config.update(
    'target',
    normalizeTargetName(target),
    vscode.ConfigurationTarget.Workspace,
  );
}

export async function selectTarget(): Promise<string | undefined> {
  const targets = await discoverTargets();
  const current = getSelectedTarget();

  if (targets.length === 0) {
    await vscode.window.showWarningMessage(
      'No CUDA-Q targets detected. Ensure CUDA-Q is installed in your Python environment.',
    );
    return undefined;
  }

  const items = targets.map((t) => ({
    label: current === t ? `$(check) ${t}` : t,
    description: current === t ? 'Current target' : undefined,
    target: t,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select CUDA-Q Target',
    title: 'Select CUDA-Q Target',
  });

  if (picked) {
    await setSelectedTarget(picked.target);
    return picked.target;
  }

  return undefined;
}

export function getTargetEnvVar(target: string): Record<string, string> {
  if (!target) {
    return {};
  }
  return { CUDAQ_TARGET: target };
}
