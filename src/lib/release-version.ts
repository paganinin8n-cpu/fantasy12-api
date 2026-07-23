import fs from 'node:fs'
import path from 'node:path'

function readReleaseVersion(): string {
  const configuredVersion = process.env.APP_VERSION?.trim()
  if (configuredVersion) return configuredVersion

  try {
    const packagedVersion = fs
      .readFileSync(path.join(process.cwd(), '.release-version'), 'utf8')
      .trim()

    return packagedVersion || 'unknown'
  } catch {
    return 'unknown'
  }
}

export const releaseVersion = readReleaseVersion()
