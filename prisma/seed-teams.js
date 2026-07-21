const { PrismaClient } = require('@prisma/client')

function club(countryCode, slug, name, shortName, country, aliases = [], logoUrl) {
  return {
    externalId: `seed:club:${countryCode}:${slug}`,
    name,
    shortName,
    country,
    type: 'CLUB',
    aliases,
    logoUrl,
  }
}

function national(code, name, shortName, country, aliases = [], logoUrl) {
  return {
    externalId: `seed:national:${code}`,
    name,
    shortName,
    country,
    type: 'NATIONAL',
    aliases,
    logoUrl,
  }
}

const CLUBS = [
  // Campeonato Brasileiro Série A 2026 — fonte de conferência: CBF.
  club('br', 'palmeiras', 'Palmeiras', 'PAL', 'Brasil'),
  club('br', 'flamengo', 'Flamengo', 'FLA', 'Brasil'),
  club('br', 'fluminense', 'Fluminense', 'FLU', 'Brasil'),
  club('br', 'red-bull-bragantino', 'Red Bull Bragantino', 'RBB', 'Brasil', ['RB Bragantino']),
  club('br', 'athletico-paranaense', 'Athletico Paranaense', 'CAP', 'Brasil'),
  club('br', 'bahia', 'Bahia', 'BAH', 'Brasil'),
  club('br', 'coritiba', 'Coritiba', 'CFC', 'Brasil', ['Coritiba SAF']),
  club('br', 'sao-paulo', 'São Paulo', 'SAO', 'Brasil', ['São Paulo FC']),
  club('br', 'botafogo', 'Botafogo', 'BOT', 'Brasil'),
  club('br', 'vitoria', 'Vitória', 'VIT', 'Brasil'),
  club('br', 'atletico-mineiro', 'Atlético Mineiro', 'CAM', 'Brasil'),
  club('br', 'corinthians', 'Corinthians', 'COR', 'Brasil'),
  club('br', 'cruzeiro', 'Cruzeiro', 'CRU', 'Brasil'),
  club('br', 'internacional', 'Internacional', 'INT', 'Brasil'),
  club('br', 'santos', 'Santos', 'SAN', 'Brasil', ['Santos FC']),
  club('br', 'gremio', 'Grêmio', 'GRE', 'Brasil'),
  club('br', 'vasco-da-gama', 'Vasco da Gama', 'VAS', 'Brasil', ['Vasco da Gama SAF']),
  club('br', 'mirassol', 'Mirassol', 'MIR', 'Brasil'),
  club('br', 'remo', 'Remo', 'REM', 'Brasil'),
  club('br', 'chapecoense', 'Chapecoense', 'CHA', 'Brasil'),

  // Outros clubes brasileiros relevantes para Série B, copas e histórico.
  club('br', 'ceara', 'Ceará', 'CEA', 'Brasil'),
  club('br', 'fortaleza', 'Fortaleza', 'FOR', 'Brasil'),
  club('br', 'sport-recife', 'Sport Recife', 'SPT', 'Brasil', ['Sport']),
  club('br', 'juventude', 'Juventude', 'JUV', 'Brasil'),
  club('br', 'goias', 'Goiás', 'GOI', 'Brasil'),
  club('br', 'america-mineiro', 'América Mineiro', 'AMG', 'Brasil'),
  club('br', 'avai', 'Avaí', 'AVA', 'Brasil'),
  club('br', 'ponte-preta', 'Ponte Preta', 'PON', 'Brasil'),
  club('br', 'guarani', 'Guarani', 'GUA', 'Brasil'),
  club('br', 'nautico', 'Náutico', 'NAU', 'Brasil'),
  club('br', 'vila-nova', 'Vila Nova', 'VNO', 'Brasil'),
  club('br', 'crb', 'CRB', 'CRB', 'Brasil'),
  club('br', 'paysandu', 'Paysandu', 'PAY', 'Brasil'),
  club('br', 'cuiaba', 'Cuiabá', 'CUI', 'Brasil'),
  club('br', 'atletico-goianiense', 'Atlético Goianiense', 'ACG', 'Brasil'),
  club('br', 'criciuma', 'Criciúma', 'CRI', 'Brasil'),
  club('br', 'novorizontino', 'Novorizontino', 'NOV', 'Brasil'),

  // América do Sul.
  club('ar', 'river-plate', 'River Plate', 'RIV', 'Argentina'),
  club('ar', 'boca-juniors', 'Boca Juniors', 'BOC', 'Argentina'),
  club('ar', 'racing-club', 'Racing Club', 'RAC', 'Argentina'),
  club('ar', 'independiente', 'Independiente', 'IND', 'Argentina'),
  club('ar', 'san-lorenzo', 'San Lorenzo', 'SLO', 'Argentina'),
  club('ar', 'estudiantes', 'Estudiantes', 'EST', 'Argentina'),
  club('ar', 'velez-sarsfield', 'Vélez Sarsfield', 'VEL', 'Argentina'),
  club('ar', 'rosario-central', 'Rosario Central', 'ROS', 'Argentina'),
  club('uy', 'penarol', 'Peñarol', 'PEN', 'Uruguai'),
  club('uy', 'nacional', 'Nacional', 'NAC', 'Uruguai'),
  club('uy', 'defensor-sporting', 'Defensor Sporting', 'DEF', 'Uruguai'),
  club('uy', 'danubio', 'Danubio', 'DAN', 'Uruguai'),
  club('cl', 'colo-colo', 'Colo-Colo', 'COL', 'Chile'),
  club('cl', 'universidad-de-chile', 'Universidad de Chile', 'UCH', 'Chile'),
  club('cl', 'universidad-catolica', 'Universidad Católica', 'UCA', 'Chile'),
  club('py', 'olimpia', 'Olimpia', 'OLI', 'Paraguai'),
  club('py', 'cerro-porteno', 'Cerro Porteño', 'CCP', 'Paraguai'),
  club('py', 'libertad', 'Libertad', 'LIB', 'Paraguai'),
  club('co', 'atletico-nacional', 'Atlético Nacional', 'ANA', 'Colômbia'),
  club('co', 'millonarios', 'Millonarios', 'MIL', 'Colômbia'),
  club('co', 'america-de-cali', 'América de Cali', 'ADC', 'Colômbia'),
  club('co', 'junior', 'Junior', 'JUN', 'Colômbia'),
  club('ec', 'ldu-quito', 'LDU Quito', 'LDU', 'Equador'),
  club('ec', 'independiente-del-valle', 'Independiente del Valle', 'IDV', 'Equador'),
  club('ec', 'barcelona-sc', 'Barcelona SC', 'BSC', 'Equador'),

  // Inglaterra.
  club('eng', 'arsenal', 'Arsenal', 'ARS', 'Inglaterra'),
  club('eng', 'chelsea', 'Chelsea', 'CHE', 'Inglaterra'),
  club('eng', 'liverpool', 'Liverpool', 'LIV', 'Inglaterra'),
  club('eng', 'manchester-city', 'Manchester City', 'MCI', 'Inglaterra'),
  club('eng', 'manchester-united', 'Manchester United', 'MUN', 'Inglaterra'),
  club('eng', 'tottenham-hotspur', 'Tottenham Hotspur', 'TOT', 'Inglaterra', ['Tottenham']),
  club('eng', 'newcastle-united', 'Newcastle United', 'NEW', 'Inglaterra'),
  club('eng', 'aston-villa', 'Aston Villa', 'AVL', 'Inglaterra'),
  club('eng', 'everton', 'Everton', 'EVE', 'Inglaterra'),
  club('eng', 'west-ham-united', 'West Ham United', 'WHU', 'Inglaterra', ['West Ham']),

  // Espanha.
  club('es', 'real-madrid', 'Real Madrid', 'RMA', 'Espanha'),
  club('es', 'barcelona', 'Barcelona', 'BAR', 'Espanha', ['FC Barcelona']),
  club('es', 'atletico-de-madrid', 'Atlético de Madrid', 'ATM', 'Espanha', ['Atlético Madrid']),
  club('es', 'athletic-club', 'Athletic Club', 'ATH', 'Espanha', ['Athletic Bilbao']),
  club('es', 'sevilla', 'Sevilla', 'SEV', 'Espanha'),
  club('es', 'villarreal', 'Villarreal', 'VIL', 'Espanha'),
  club('es', 'real-sociedad', 'Real Sociedad', 'RSO', 'Espanha'),
  club('es', 'real-betis', 'Real Betis', 'BET', 'Espanha'),
  club('es', 'valencia', 'Valencia', 'VAL', 'Espanha'),
  club('es', 'celta-de-vigo', 'Celta de Vigo', 'CEL', 'Espanha'),

  // Itália.
  club('it', 'inter', 'Inter de Milão', 'INT', 'Itália', ['Internazionale', 'Inter Milan']),
  club('it', 'milan', 'Milan', 'MIL', 'Itália', ['AC Milan']),
  club('it', 'juventus', 'Juventus', 'JUV', 'Itália'),
  club('it', 'napoli', 'Napoli', 'NAP', 'Itália'),
  club('it', 'roma', 'Roma', 'ROM', 'Itália', ['AS Roma']),
  club('it', 'lazio', 'Lazio', 'LAZ', 'Itália'),
  club('it', 'atalanta', 'Atalanta', 'ATA', 'Itália'),
  club('it', 'fiorentina', 'Fiorentina', 'FIO', 'Itália'),
  club('it', 'bologna', 'Bologna', 'BOL', 'Itália'),

  // Alemanha.
  club('de', 'bayern-munchen', 'Bayern München', 'BAY', 'Alemanha', ['Bayern de Munique']),
  club('de', 'borussia-dortmund', 'Borussia Dortmund', 'BVB', 'Alemanha'),
  club('de', 'bayer-leverkusen', 'Bayer Leverkusen', 'B04', 'Alemanha'),
  club('de', 'rb-leipzig', 'RB Leipzig', 'RBL', 'Alemanha'),
  club('de', 'eintracht-frankfurt', 'Eintracht Frankfurt', 'SGE', 'Alemanha'),
  club('de', 'borussia-monchengladbach', 'Borussia Mönchengladbach', 'BMG', 'Alemanha'),
  club('de', 'schalke-04', 'Schalke 04', 'S04', 'Alemanha'),

  // França.
  club('fr', 'paris-saint-germain', 'Paris Saint-Germain', 'PSG', 'França'),
  club('fr', 'olympique-de-marseille', 'Olympique de Marseille', 'OM', 'França', ['Marseille']),
  club('fr', 'olympique-lyon', 'Olympique Lyon', 'OL', 'França', ['Lyon']),
  club('fr', 'monaco', 'Monaco', 'ASM', 'França', ['AS Monaco']),
  club('fr', 'lille', 'Lille', 'LIL', 'França'),
  club('fr', 'nice', 'Nice', 'NIC', 'França'),

  // Portugal e Países Baixos.
  club('pt', 'benfica', 'Benfica', 'BEN', 'Portugal'),
  club('pt', 'porto', 'Porto', 'POR', 'Portugal', ['FC Porto']),
  club('pt', 'sporting', 'Sporting', 'SCP', 'Portugal', ['Sporting CP']),
  club('pt', 'braga', 'Braga', 'SCB', 'Portugal'),
  club('pt', 'vitoria-de-guimaraes', 'Vitória de Guimarães', 'VSC', 'Portugal'),
  club('nl', 'ajax', 'Ajax', 'AJA', 'Países Baixos'),
  club('nl', 'psv', 'PSV', 'PSV', 'Países Baixos'),
  club('nl', 'feyenoord', 'Feyenoord', 'FEY', 'Países Baixos'),
  club('nl', 'az-alkmaar', 'AZ Alkmaar', 'AZ', 'Países Baixos'),

  // Outros clubes europeus recorrentes em competições continentais.
  club('sct', 'celtic', 'Celtic', 'CEL', 'Escócia'),
  club('sct', 'rangers', 'Rangers', 'RAN', 'Escócia'),
  club('tr', 'galatasaray', 'Galatasaray', 'GAL', 'Turquia'),
  club('tr', 'fenerbahce', 'Fenerbahçe', 'FEN', 'Turquia'),
  club('gr', 'olympiacos', 'Olympiacos', 'OLY', 'Grécia'),
  club('rs', 'estrela-vermelha', 'Estrela Vermelha', 'CRZ', 'Sérvia', ['Red Star Belgrade']),
  club('hr', 'dinamo-zagreb', 'Dinamo Zagreb', 'DIN', 'Croácia'),
  club('ua', 'shakhtar-donetsk', 'Shakhtar Donetsk', 'SHA', 'Ucrânia'),
]

const NATIONALS = [
  national('bra', 'Brasil', 'BRA', 'Brasil'),
  national('arg', 'Argentina', 'ARG', 'Argentina'),
  national('fra', 'França', 'FRA', 'França'),
  national('eng', 'Inglaterra', 'ENG', 'Inglaterra'),
  national('esp', 'Espanha', 'ESP', 'Espanha'),
  national('ger', 'Alemanha', 'GER', 'Alemanha'),
  national('por', 'Portugal', 'POR', 'Portugal'),
  national('ita', 'Itália', 'ITA', 'Itália'),
  national('ned', 'Países Baixos', 'NED', 'Países Baixos', ['Holanda']),
  national('bel', 'Bélgica', 'BEL', 'Bélgica'),
  national('cro', 'Croácia', 'CRO', 'Croácia'),
  national('mar', 'Marrocos', 'MAR', 'Marrocos'),
  national('uru', 'Uruguai', 'URU', 'Uruguai'),
  national('col', 'Colômbia', 'COL', 'Colômbia'),
  national('mex', 'México', 'MEX', 'México'),
  national('usa', 'Estados Unidos', 'USA', 'Estados Unidos', ['EUA']),
  national('can', 'Canadá', 'CAN', 'Canadá'),
  national('crc', 'Costa Rica', 'CRC', 'Costa Rica'),
  national('sen', 'Senegal', 'SEN', 'Senegal'),
  national('nga', 'Nigéria', 'NGA', 'Nigéria'),
  national('egy', 'Egito', 'EGY', 'Egito'),
  national('cmr', 'Camarões', 'CMR', 'Camarões'),
  national('alg', 'Argélia', 'ALG', 'Argélia'),
  national('jpn', 'Japão', 'JPN', 'Japão'),
  national('kor', 'Coreia do Sul', 'KOR', 'Coreia do Sul'),
  national('aus', 'Austrália', 'AUS', 'Austrália'),
  national('chi', 'Chile', 'CHI', 'Chile'),
  national('par', 'Paraguai', 'PAR', 'Paraguai'),
  national('ecu', 'Equador', 'ECU', 'Equador'),
  national('per', 'Peru', 'PER', 'Peru'),
  national('ven', 'Venezuela', 'VEN', 'Venezuela'),
  national('bol', 'Bolívia', 'BOL', 'Bolívia'),
]

const TEAM_CATALOG = [...CLUBS, ...NATIONALS]

function validateTeamCatalog(catalog = TEAM_CATALOG) {
  const errors = []
  const externalIds = new Set()
  const canonicalNames = new Set()

  for (const team of catalog) {
    if (!team.name || !team.shortName || !team.country || !team.externalId) {
      errors.push(`Registro incompleto: ${JSON.stringify(team)}`)
    }
    if (!['CLUB', 'NATIONAL'].includes(team.type)) {
      errors.push(`Tipo inválido para ${team.name}: ${team.type}`)
    }
    if (externalIds.has(team.externalId)) {
      errors.push(`externalId duplicado: ${team.externalId}`)
    }
    externalIds.add(team.externalId)

    const canonicalKey = `${team.type}:${team.country}:${team.name}`.toLocaleLowerCase('pt-BR')
    if (canonicalNames.has(canonicalKey)) {
      errors.push(`Time duplicado: ${team.name} (${team.country})`)
    }
    canonicalNames.add(canonicalKey)
  }

  if (errors.length > 0) {
    throw new Error(`Catálogo de times inválido:\n- ${errors.join('\n- ')}`)
  }

  return {
    clubs: catalog.filter((team) => team.type === 'CLUB').length,
    nationals: catalog.filter((team) => team.type === 'NATIONAL').length,
    total: catalog.length,
  }
}

async function findExistingTeam(prisma, team) {
  const bySeedId = await prisma.team.findUnique({ where: { externalId: team.externalId } })
  if (bySeedId) return bySeedId

  const candidates = await prisma.team.findMany({
    where: {
      type: team.type,
      name: { in: [team.name, ...team.aliases], mode: 'insensitive' },
    },
    orderBy: { createdAt: 'asc' },
    take: 3,
  })

  if (candidates.length <= 1) return candidates[0] ?? null

  const sameCountry = candidates.filter(
    (candidate) => candidate.country?.localeCompare(team.country, 'pt-BR', { sensitivity: 'base' }) === 0
  )
  if (sameCountry.length === 1) return sameCountry[0]

  throw new Error(
    `Não foi possível reconciliar ${team.name}: existem ${candidates.length} registros com o mesmo nome/alias.`
  )
}

async function seedTeams(prisma) {
  const summary = validateTeamCatalog()
  let created = 0
  let updated = 0

  for (const team of TEAM_CATALOG) {
    const existing = await findExistingTeam(prisma, team)
    const updateData = {
      externalId: team.externalId,
      name: team.name,
      shortName: team.shortName,
      country: team.country,
      type: team.type,
      active: true,
      ...(team.logoUrl ? { logoUrl: team.logoUrl } : {}),
    }

    if (existing) {
      await prisma.team.update({ where: { id: existing.id }, data: updateData })
      updated += 1
      continue
    }

    await prisma.team.create({
      data: {
        ...updateData,
        logoUrl: team.logoUrl ?? null,
      },
    })
    created += 1
  }

  return { ...summary, created, updated }
}

async function runFromCli() {
  const summary = validateTeamCatalog()
  if (process.argv.includes('--dry-run')) {
    console.log(`Catálogo válido: ${summary.total} times (${summary.clubs} clubes, ${summary.nationals} seleções).`)
    return
  }

  const prisma = new PrismaClient()
  try {
    const result = await seedTeams(prisma)
    console.log(
      `Seed de times concluído: ${result.total} processados, ${result.created} criados, ${result.updated} atualizados.`
    )
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  runFromCli().catch((error) => {
    console.error('Falha no seed de times.')
    console.error(error)
    process.exitCode = 1
  })
}

module.exports = {
  CLUBS,
  NATIONALS,
  TEAM_CATALOG,
  seedTeams,
  validateTeamCatalog,
}
