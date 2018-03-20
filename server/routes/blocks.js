const route = require('koa-route')
const blockchain = require('../blockchain/blockchain')

/**
 * Creates a new block (or updates existing one) with discovered nonce that is fit for the required difficulty.
 */
exports.create = route.post('/blocks', async ctx => {
  const minedBlock = ctx.request.body
  ctx.assert(minedBlock.nonce, 400, '"nonce" field is required.')

  const reward = await blockchain.collectMiningReward(minedBlock.nonce, ctx.state.user.uid)

  ctx.body = {reward}
  ctx.status = 201
})
