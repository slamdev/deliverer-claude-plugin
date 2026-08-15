/**
 * Running one command and reporting what it did — the harness's whole shell (end-to-end-tests
 * ticket 01).
 *
 * Two commands are between a contributor and a run: `git`, which builds the staged copy, and
 * `claude`, which adds the marketplaces and installs the plugin. Neither is driven through a
 * shell: the arguments are passed as arguments, so a run directory whose path contains a space is
 * a path and not three of them.
 *
 * A failure THROWS carrying the command, the exit status and both output streams. This is the
 * layer at which "the plugin broke" and "the harness broke" are still told apart cheaply — `claude
 * plugin install` refusing by name is the first, `git` not being on the path is the second — and a
 * test whose only evidence was a non-zero exit code would leave a contributor to reproduce the run
 * to find out which.
 */
import { execFile } from "node:child_process";

/**
 * What a command that SUCCEEDED gives back. Only its stdout: a caller reads that for the listing or
 * the commit it asked for, and a successful command's stderr is progress nobody is waiting on. The
 * failure below carries both streams, which is where they are worth having.
 */
export interface CommandResult {
  readonly stdout: string;
}

export interface CommandOptions {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  /** what this step was for, so a failure says it in the contributor's words rather than argv's */
  readonly purpose: string;
}

export function execute(
  command: string,
  args: readonly string[],
  options: CommandOptions,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      [...args],
      // The output of an install is small; a limit that truncated it would truncate the diagnosis.
      { cwd: options.cwd, env: options.env, maxBuffer: 32 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error === null) {
          resolve({ stdout });
          return;
        }
        reject(
          new Error(
            `${options.purpose} failed.\n` +
              `  command: ${command} ${args.join(" ")}\n` +
              `  in: ${options.cwd}\n` +
              `  ${error.message}\n` +
              `  stdout: ${stdout.trim() === "" ? "(empty)" : stdout.trim()}\n` +
              `  stderr: ${stderr.trim() === "" ? "(empty)" : stderr.trim()}`,
          ),
        );
      },
    );
  });
}
