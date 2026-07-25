const assert = require('node:assert/strict')
const test = require('node:test')

const { CreateUserSchema } = require('../dist/validators/createUser.validator')
const { ageInYears, isAtLeastAge, parseDateOnly } = require('../dist/utils/age')

const baseUser = {
  name: 'Usuário Teste',
  nickname: 'teste',
  email: 'teste@example.com',
  cpf: '12345678901',
  phone: '11999999999',
  password: 'segredo12',
}

function yearsAgoIso(years, { month = 1, day = 1 } = {}) {
  const now = new Date()
  const year = now.getUTCFullYear() - years
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

test('parseDateOnly rejeita datas inexistentes', () => {
  assert.equal(parseDateOnly('2020-02-30'), null)
  assert.equal(parseDateOnly('20-01-01'), null)
  assert.ok(parseDateOnly('2000-01-01') instanceof Date)
})

test('idade completa considera aniversário ainda não ocorrido', () => {
  const birth = parseDateOnly('2000-12-31')
  const beforeBirthday = new Date('2020-12-30T15:00:00.000Z')
  const onBirthday = new Date('2020-12-31T15:00:00.000Z')
  assert.equal(ageInYears(birth, beforeBirthday), 19)
  assert.equal(ageInYears(birth, onBirthday), 20)
  assert.equal(isAtLeastAge(birth, 20, beforeBirthday), false)
  assert.equal(isAtLeastAge(birth, 20, onBirthday), true)
})

test('cadastro exige birthDate e rejeita menor de 18', () => {
  assert.equal(CreateUserSchema.safeParse(baseUser).success, false)

  const underage = CreateUserSchema.safeParse({
    ...baseUser,
    birthDate: yearsAgoIso(17),
  })
  assert.equal(underage.success, false)
  assert.match(underage.error.issues[0].message, /18 anos/i)

  const adult = CreateUserSchema.parse({
    ...baseUser,
    birthDate: yearsAgoIso(25),
  })
  assert.ok(adult.birthDate instanceof Date)
})
