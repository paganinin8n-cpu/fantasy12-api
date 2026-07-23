import fs from 'node:fs'
import path from 'node:path'

function readReleaseVersion(): string {
  try {
    const packagedVersion = fs
      .readFileSync(path.join(process.cwd(), '.release-version'), 'utf8')
      .trim()

    if (packagedVersion) return packagedVersion
  } catch {
    // Local runs can fall back to an explicitly configured version.
  }

  return process.env.APP_VERSION?.trim() || 'unknown'
}

export const releaseVersion = readReleaseVersion()
