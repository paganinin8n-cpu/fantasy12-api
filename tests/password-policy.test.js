const assert = require('node:assert/strict')
const test = require('node:test')

const {
  getPasswordPolicyError,
  assertPasswordPolicy,
  hashPassword,
} = require('../dist/security/password')
const { NewPasswordSchema } = require('../dist/validators/password.schema')
const { CreateUserSchema } = require('../dist/validators/createUser.validator')
const { AppError } = require('../dist/errors/AppError')

const baseUser = {
  name: 'Usuário Teste',
  nickname: 'teste',
  email: 'teste@example.com',
  cpf: '12345678901',
  phone: '11999999999',
  birthDate: '1990-01-15',
}

test('política rejeita senha curta, sem maiúscula, sem minúscula ou sem número', () => {
  assert.match(getPasswordPolicyError('Abc1'), /entre 8 e 128/i)
  assert.match(getPasswordPolicyError('abcdefgh'), /maiúscula/i)
  assert.match(getPasswordPolicyError('ABCDEFGH'), /minúscula/i)
  assert.match(getPasswordPolicyError('Abcdefgh'), /número/i)
  assert.equal(getPasswordPolicyError('Abcdefg1'), null)
})

test('assertPasswordPolicy lança AppError weak_password', () => {
  assert.throws(
    () => assertPasswordPolicy('fraca'),
    (error) => error instanceof AppError && error.code === 'weak_password'
  )
})

test('NewPasswordSchema e cadastro aceitam senha forte e rejeitam fraca', () => {
  assert.equal(NewPasswordSchema.safeParse('Abcdefg1').success, true)
  assert.equal(NewPasswordSchema.safeParse('abcdefg1').success, false)

  assert.equal(
    CreateUserSchema.safeParse({ ...baseUser, password: 'abcdefg1' }).success,
    false
  )
  assert.equal(
    CreateUserSchema.safeParse({ ...baseUser, password: 'Abcdefg1' }).success,
    true
  )
})

test('hashPassword só aceita senha dentro da política', async () => {
  await assert.rejects(() => hashPassword('abcdefg1'), /maiúscula/i)
  const hash = await hashPassword('Abcdefg1')
  assert.match(hash, /^\$f12-sha256\$/)
})
