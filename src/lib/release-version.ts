import fs from 'node:fs'
import path from 'node:path'

const embeddedReleaseVersion = '__FANTASY12_RELEASE_VERSION__'

function readReleaseVersion(): string {
  if (/^[0-9a-f]{40}$/.test(embeddedReleaseVersion)) {
    return embeddedReleaseVersion
  }

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
