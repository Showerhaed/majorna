const route = require('koa-route')
const db = require('../data/db')

/**
 * Create user doc and return a blank response (204).
 */
exports.init = route.get('/users/init', async ctx => {
  try {
    await db.createUserDoc(ctx.state.user)
  } catch (e) {
    console.error(e)
    ctx.throw(400, 'user init failed')
  }
  ctx.status = 204
})

/**
 * Send majorna to another user.
 */
exports.send = route.get('/users/send', async ctx => {
  ctx.status = 501
})
