const assert = require('assert')
const db = require('./db')

test('init', async () => {
  await db.init()
})

test('getMeta', async () => {
  const meta = await db.getMeta()
  assert(meta.cap >= 500)
  assert(meta.val >= 0)
})

test('makeTx, getTx', async () => {
  // valid and invalid txs
  // verify all changes to sender and receiver are complete
})

test('createUserDoc', async () => {
  // todo: get user doc and verify fields
  // todo: verify market cap
  // todo: verify txs collection
  const meta = await db.getMeta()

  await db.createUserDoc(db.testData.users.u3Doc, '3')

  const metaAfter = await db.getMeta()
  assert(metaAfter.cap === meta.cap + 500)
})
