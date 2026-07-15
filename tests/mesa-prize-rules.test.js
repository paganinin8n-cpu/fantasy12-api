const assert = require('node:assert/strict')
const test = require('node:test')

const {
  MESA_PRIZE_RULES_ERROR_CODE,
  MESA_PRIZE_RULES_MAX_LENGTH,
  MESA_PRIZE_RULES_MIN_LENGTH,
  normalizeMesaPrizeRules,
} = require('../dist/services/bolao/mesa-prize-rules')

test('normaliza regras de premiacao validas', () => {
  assert.equal(
    normalizeMesaPrizeRules('  Premiação 60/30/10 do líquido.  '),
    'Premiação 60/30/10 do líquido.'
  )
})

test('rejeita regras ausentes, em branco ou fora do tamanho', () => {
  for (const raw of [undefined, null, '', '   ', 'curta']) {
    assert.throws(
      () => normalizeMesaPrizeRules(raw),
      (error) => {
        assert.equal(error.code, MESA_PRIZE_RULES_ERROR_CODE)
        return true
      }
    )
  }

  assert.throws(
    () => normalizeMesaPrizeRules('x'.repeat(MESA_PRIZE_RULES_MAX_LENGTH + 1)),
    (error) => {
      assert.equal(error.code, MESA_PRIZE_RULES_ERROR_CODE)
      assert.equal(error.details.maxLength, MESA_PRIZE_RULES_MAX_LENGTH)
      assert.equal(error.details.minLength, MESA_PRIZE_RULES_MIN_LENGTH)
      return true
    }
  )
})
