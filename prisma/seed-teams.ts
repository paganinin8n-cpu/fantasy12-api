/**
 * Seed inicial de times: Brasileirão Série A/B + principais seleções.
 * Uso: npx ts-node prisma/seed-teams.ts
 */

import { PrismaClient, TeamType } from '@prisma/client'

const prisma = new PrismaClient()

const CLUBS: Array<{ name: string; shortName: string; country: string; logoUrl?: string; externalId?: string }> = [
  // Brasileirão Série A 2025
  { name: 'Flamengo', shortName: 'FLA', country: 'Brasil', externalId: 'br-127' },
  { name: 'Palmeiras', shortName: 'PAL', country: 'Brasil', externalId: 'br-121' },
  { name: 'Atlético Mineiro', shortName: 'ATM', country: 'Brasil', externalId: 'br-1062' },
  { name: 'Fluminense', shortName: 'FLU', country: 'Brasil', externalId: 'br-120' },
  { name: 'Corinthians', shortName: 'COR', country: 'Brasil', externalId: 'br-131' },
  { name: 'São Paulo', shortName: 'SPF', country: 'Brasil', externalId: 'br-126' },
  { name: 'Internacional', shortName: 'INT', country: 'Brasil', externalId: 'br-119' },
  { name: 'Grêmio', shortName: 'GRE', country: 'Brasil', externalId: 'br-130' },
  { name: 'Botafogo', shortName: 'BOT', country: 'Brasil', externalId: 'br-128' },
  { name: 'Santos', shortName: 'SAN', country: 'Brasil', externalId: 'br-123' },
  { name: 'Vasco da Gama', shortName: 'VAS', country: 'Brasil', externalId: 'br-129' },
  { name: 'Athletico Paranaense', shortName: 'CAP', country: 'Brasil', externalId: 'br-118' },
  { name: 'Cruzeiro', shortName: 'CRU', country: 'Brasil', externalId: 'br-132' },
  { name: 'Bahia', shortName: 'BAH', country: 'Brasil', externalId: 'br-122' },
  { name: 'Fortaleza', shortName: 'FOR', country: 'Brasil', externalId: 'br-2020' },
  { name: 'RB Bragantino', shortName: 'RBB', country: 'Brasil', externalId: 'br-9003' },
  { name: 'Juventude', shortName: 'JUV', country: 'Brasil', externalId: 'br-146' },
  { name: 'Mirassol', shortName: 'MIR', country: 'Brasil', externalId: 'br-9501' },
  { name: 'Ceará', shortName: 'CEA', country: 'Brasil', externalId: 'br-136' },
  { name: 'Sport Recife', shortName: 'SPT', country: 'Brasil', externalId: 'br-141' },
  // Série B
  { name: 'Coritiba', shortName: 'CFC', country: 'Brasil', externalId: 'br-133' },
  { name: 'Goiás', shortName: 'GOI', country: 'Brasil', externalId: 'br-138' },
  { name: 'América Mineiro', shortName: 'AME', country: 'Brasil', externalId: 'br-163' },
  { name: 'Avaí', shortName: 'AVA', country: 'Brasil', externalId: 'br-148' },
  { name: 'Ponte Preta', shortName: 'PON', country: 'Brasil', externalId: 'br-143' },
  { name: 'Chapecoense', shortName: 'CHA', country: 'Brasil', externalId: 'br-162' },
  { name: 'Guarani', shortName: 'GUA', country: 'Brasil', externalId: 'br-144' },
  { name: 'Náutico', shortName: 'NAU', country: 'Brasil', externalId: 'br-140' },
  { name: 'Vila Nova', shortName: 'VNO', country: 'Brasil', externalId: 'br-161' },
  { name: 'CRB', shortName: 'CRB', country: 'Brasil', externalId: 'br-1193' },
  // Principais da América do Sul
  { name: 'River Plate', shortName: 'RIV', country: 'Argentina', externalId: 'arg-26' },
  { name: 'Boca Juniors', shortName: 'BOC', country: 'Argentina', externalId: 'arg-28' },
  { name: 'Peñarol', shortName: 'PEN', country: 'Uruguai', externalId: 'uru-2' },
  { name: 'Nacional', shortName: 'NAC', country: 'Uruguai', externalId: 'uru-3' },
  { name: 'Colo-Colo', shortName: 'COL', country: 'Chile', externalId: 'chi-23' },
  { name: 'Olimpia', shortName: 'OLI', country: 'Paraguai', externalId: 'par-10' },
  // Europa (Copa do Mundo de Clubes)
  { name: 'Real Madrid', shortName: 'RMA', country: 'Espanha', externalId: 'esp-541' },
  { name: 'Manchester City', shortName: 'MCI', country: 'Inglaterra', externalId: 'eng-50' },
  { name: 'Bayern München', shortName: 'BAY', country: 'Alemanha', externalId: 'ger-157' },
  { name: 'Chelsea', shortName: 'CHE', country: 'Inglaterra', externalId: 'eng-49' },
  { name: 'Juventus', shortName: 'JUV', country: 'Itália', externalId: 'ita-496' },
  { name: 'Inter de Milão', shortName: 'INT', country: 'Itália', externalId: 'ita-505' },
  { name: 'Paris Saint-Germain', shortName: 'PSG', country: 'França', externalId: 'fra-85' },
  { name: 'Porto', shortName: 'POR', country: 'Portugal', externalId: 'por-212' },
  { name: 'Benfica', shortName: 'BEN', country: 'Portugal', externalId: 'por-211' },
]

const NATIONALS: Array<{ name: string; shortName: string; country: string; externalId?: string }> = [
  { name: 'Brasil', shortName: 'BRA', country: 'Brasil', externalId: 'sel-9' },
  { name: 'Argentina', shortName: 'ARG', country: 'Argentina', externalId: 'sel-26' },
  { name: 'França', shortName: 'FRA', country: 'França', externalId: 'sel-2' },
  { name: 'Inglaterra', shortName: 'ENG', country: 'Inglaterra', externalId: 'sel-10' },
  { name: 'Espanha', shortName: 'ESP', country: 'Espanha', externalId: 'sel-9' },
  { name: 'Alemanha', shortName: 'GER', country: 'Alemanha', externalId: 'sel-25' },
  { name: 'Portugal', shortName: 'POR', country: 'Portugal', externalId: 'sel-27' },
  { name: 'Itália', shortName: 'ITA', country: 'Itália', externalId: 'sel-768' },
  { name: 'Holanda', shortName: 'NED', country: 'Holanda', externalId: 'sel-1118' },
  { name: 'Bélgica', shortName: 'BEL', country: 'Bélgica', externalId: 'sel-1' },
  { name: 'Croácia', shortName: 'CRO', country: 'Croácia', externalId: 'sel-3' },
  { name: 'Marrocos', shortName: 'MAR', country: 'Marrocos', externalId: 'sel-45' },
  { name: 'Uruguai', shortName: 'URU', country: 'Uruguai', externalId: 'sel-22' },
  { name: 'Colômbia', shortName: 'COL', country: 'Colômbia', externalId: 'sel-6' },
  { name: 'México', shortName: 'MEX', country: 'México', externalId: 'sel-16' },
  { name: 'Estados Unidos', shortName: 'USA', country: 'EUA', externalId: 'sel-5629' },
  { name: 'Senegal', shortName: 'SEN', country: 'Senegal', externalId: 'sel-38' },
  { name: 'Japão', shortName: 'JPN', country: 'Japão', externalId: 'sel-827' },
  { name: 'Coreia do Sul', shortName: 'KOR', country: 'Coreia do Sul', externalId: 'sel-854' },
  { name: 'Austrália', shortName: 'AUS', country: 'Austrália', externalId: 'sel-739' },
  { name: 'Chile', shortName: 'CHI', country: 'Chile', externalId: 'sel-21' },
  { name: 'Paraguai', shortName: 'PAR', country: 'Paraguai', externalId: 'sel-24' },
  { name: 'Equador', shortName: 'ECU', country: 'Equador', externalId: 'sel-7' },
  { name: 'Peru', shortName: 'PER', country: 'Peru', externalId: 'sel-23' },
  { name: 'Venezuela', shortName: 'VEN', country: 'Venezuela', externalId: 'sel-18' },
  { name: 'Bolívia', shortName: 'BOL', country: 'Bolívia', externalId: 'sel-13' },
]

async function main() {
  console.log('Seeding teams...')

  let created = 0
  let skipped = 0

  for (const club of CLUBS) {
    const result = await prisma.team.upsert({
      where: { externalId: club.externalId ?? `club-${club.name}` },
      create: { ...club, type: 'CLUB' as TeamType },
      update: { name: club.name, shortName: club.shortName, country: club.country },
    })
    console.log(`  [CLUB] ${result.name}`)
    created++
  }

  for (const nat of NATIONALS) {
    const result = await prisma.team.upsert({
      where: { externalId: nat.externalId ?? `nat-${nat.name}` },
      create: { ...nat, type: 'NATIONAL' as TeamType },
      update: { name: nat.name, shortName: nat.shortName, country: nat.country },
    })
    console.log(`  [NATIONAL] ${result.name}`)
    created++
  }

  console.log(`\nDone: ${created} teams upserted, ${skipped} skipped.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
