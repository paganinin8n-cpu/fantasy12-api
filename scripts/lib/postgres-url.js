function normalizePostgresUrl(rawUrl) {
  if (!rawUrl) {
    throw new Error('DATABASE_URL nao configurada')
  }

  const url = new URL(rawUrl)
  const schema = url.searchParams.get('schema') || 'public'

  url.searchParams.delete('schema')

  return {
    connectionUrl: url.toString(),
    schema,
  }
}

module.exports = {
  normalizePostgresUrl,
}
