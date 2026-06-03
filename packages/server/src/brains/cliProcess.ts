import { spawn } from "node:child_process";
import type { Readable } from "node:stream";

/** Minimal shape of a spawned process that StreamJsonCliBridge depends on. */
export interface SpawnResult {
  stdout: Readable;
  kill(signal?: NodeJS.Signals): void;
  on(event: "close", listener: (code: number | null) => void): void;
}

/** Injected spawn function — swap out in tests without a real binary. */
export type SpawnFn = (
  cmd: string,
  args: string[],
  opts: { cwd: string; env?: NodeJS.ProcessEnv },
) => SpawnResult;

/** Default implementation over node:child_process.spawn. */
export const defaultSpawn: SpawnFn = (cmd, args, opts) => {
  const child = spawn(cmd, args, {
    cwd: opts.cwd,
    env: opts.env ?? process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    stdout: child.stdout as Readable,
    kill: (sig = "SIGTERM") => { child.kill(sig); },
    on: (event, listener) => { child.on(event, listener); },
  };
};
