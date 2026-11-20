// Writing to the GitHub job summary, which is the panel under a finished job
// on github.com. Everything appended here is Markdown.
//
// Off the build machine there is no such file, so every call below quietly
// does nothing and the reporters just print to the terminal instead.

import { appendFileSync } from 'node:fs';

/** The file GitHub Actions hands a job to write its summary into. */
export function summaryFile(): string | null {
  const path = process.env['GITHUB_STEP_SUMMARY'];
  return path === undefined || path === '' ? null : path;
}

export function onCI(): boolean {
  return summaryFile() !== null;
}

/** Adds a block of Markdown to the job summary, if there is one to add to. */
export function appendToSummary(markdown: string): void {
  const path = summaryFile();
  if (path === null) return;
  try {
    appendFileSync(path, `${markdown}\n`, 'utf8');
  } catch (error) {
    // A summary that cannot be written is not worth failing a run over. The
    // same lines are always printed to the terminal as well.
    const reason = error instanceof Error ? error.message : String(error);
    process.stdout.write(`Could not write the job summary: ${reason}\n`);
  }
}
