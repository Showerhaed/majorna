const firebaseAdmin = require('firebase-admin')
const FieldValue = firebaseAdmin.firestore.FieldValue
const firebaseConfig = require('../config/firebase-config')
const firestore = firebaseConfig.firestore

const metaRef = firestore.collection('mj').doc('meta')
const txsRef = firestore.collection('txs')
const usersRef = firestore.collection('users')

exports.getMeta = async () => (await metaRef.get()).data()

exports.updateMarketCap = amount => firestore.runTransaction(async t => {
  const metaDoc = await t.get(metaRef)
  await t.update(metaRef, {cap: metaDoc.data().cap + amount})
})

exports.addTx = (from, to, sent, amount) => firestore.runTransaction(async t => {
  // verify sender's funds
  const senderDoc = await t.get(usersRef.doc(from))
  if (!senderDoc.exists || senderDoc.data().balance < amount) {
    throw new Error('insufficient funds')
  }

  // check if receiver exists
  const receiverDoc = await t.get(usersRef.doc(from))
  if (!receiverDoc.exists) {
    throw new Error('receiver does not exist')
  }

  // add tx to txs collection
  await t.create(txsRef.doc(), {from, to, sent, amount})

  // update user docs with tx
})

exports.getTx = async id => {
  const tx = await txsRef.doc(id).get()
  return tx.exists ? tx.data() : null
}

/**
 * Create user doc and push first bonus transaction.
 * Can be used as a firestore cloud function trigger.
 */
exports.createUserDoc = async user => {
  const uid = user.uid
  const email = user.email
  const name = user.name || user.displayName // firebase auth token || firestore event

  const time = FieldValue.serverTimestamp()
  const initBalance = 500

  // create the first transaction for the user
  const txRef = await txsRef.add({from: 'majorna', to: uid, sent: time, amount: initBalance})
  const txDoc = await txRef.get()
  const tx = txDoc.data()

  // create user doc
  await usersRef.doc(uid).set({
    email: email,
    name: name,
    created: time,
    balance: initBalance,
    transactions: [
      {
        id: txRef.id,
        from: 'majorna',
        sent: tx.sent,
        amount: initBalance
      }
    ]
  })

  // increase market cap
  await exports.updateMarketCap(initBalance)
  console.log(`created user: ${uid} - ${email} - ${name}`)
}
