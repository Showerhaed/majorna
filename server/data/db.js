const firebaseAdmin = require('firebase-admin')
const FieldValue = firebaseAdmin.firestore.FieldValue
const firebaseConf = require('firebase-conf')
const firestore = firebaseConf.firestore

/**
 * Create user doc and push first bonus transaction.
 * Can be used as a firestore cloud function trigger.
 */
exports.createUserDoc = async (user) => {
  const uid = user.uid
  const email = user.email
  const name = user.name || user.displayName // firebase auth token || firestore event

  const time = FieldValue.serverTimestamp()
  const initBalance = 500

  // create the first transaction for the user
  const txDoc = await firestore.collection('txs').add({
    from: 'majorna',
    to: uid,
    sent: time,
    amount: initBalance
  })

  // create user doc
  await firestore.collection('users').doc(uid).set({
    email: email,
    name: name,
    created: time,
    balance: initBalance,
    transactions: [
      {
        id: txDoc.id,
        from: 'majorna',
        sent: txDoc.sent,
        amount: initBalance
      }
    ]
  })

  // increase market cap
  await exports.updateMarketCap(initBalance)

  console.log(`created user: ${uid} - ${email} - ${name}`)
}

/**
 * Updates market cap metadata with given amount.
 */
exports.updateMarketCap = async (amount) => {
  firestore.runTransaction(async t => {
    const metaRef = firestore.collection('mj').doc('meta')
    const metaDoc = await t.get(metaRef)
    await t.update(metaRef, {cap: metaDoc.data().cap + amount})
  })
}

exports.getMeta = async firestore => (await firestore.collection('mj').doc('meta').get()).data()
