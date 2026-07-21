const assert = require('node:assert/strict')
const test = require('node:test')

const { CreateUserSchema } = require('../dist/validators/createUser.validator')
const { UpdateProfileSchema } = require('../dist/validators/me.validator')

const baseUser = {
  name: 'Usuário Teste',
  nickname: 'teste',
  email: 'teste@example.com',
  cpf: '12345678901',
  phone: '11999999999',
  password: 'segredo',
}

test('cadastro aceita foto comprimida em data URL como campo opcional', () => {
  const profileImage = `data:image/jpeg;base64,${Buffer.from('foto').toString('base64')}`
  const parsed = CreateUserSchema.parse({ ...baseUser, profileImage })
  assert.equal(parsed.profileImage, profileImage)
  assert.equal(CreateUserSchema.parse(baseUser).profileImage, undefined)
})

test('perfil aceita URL web, data URL e remoção explícita', () => {
  assert.equal(
    UpdateProfileSchema.parse({ profileImage: 'https://example.com/avatar.jpg' }).profileImage,
    'https://example.com/avatar.jpg'
  )
  assert.equal(
    UpdateProfileSchema.parse({ profileImage: 'data:image/webp;base64,YQ==' }).profileImage,
    'data:image/webp;base64,YQ=='
  )
  assert.equal(UpdateProfileSchema.parse({ profileImage: null }).profileImage, null)
})

test('perfil rejeita conteúdo que não seja imagem ou URL HTTP', () => {
  assert.throws(
    () => UpdateProfileSchema.parse({ profileImage: 'javascript:alert(1)' }),
    /Foto do perfil inválida/i
  )
})
