const firebaseConfig = require('../config/firebase')
const firestore = firebaseConfig.firestore

// collection and doc refs
const txsRef = firestore.collection('txs')
const usersRef = firestore.collection('users')
const metaRef = firestore.collection('mj').doc('meta')

/**
 * Initializes database collections if database is empty, asynchronously.
 */
exports.init = async () => {
  const metaDoc = await metaRef.get()
  if (metaDoc.exists) {
    return
  }

  const batch = firestore.batch()
  batch.create(metaRef, {val: 0.01, cap: 0})
  await batch.commit()
}

/**
 * Get majorna metadata document asynchronously.
 */
exports.getMeta = async () => (await metaRef.get()).data()

/**
 * Get a user by id, asynchronously.
 */
exports.getUser = async id => {
  const user = await usersRef.doc(id).get()
  return user.exists ? user.data() : null
}

/**
 * Create user doc and push first bonus transaction, asynchronously.
 * Can be used as a firestore cloud function trigger.
 */
exports.createUserDoc = (user, uid) => firestore.runTransaction(async t => {
  uid = uid || user.uid
  const email = user.email
  const name = user.name || user.displayName // decoded firebase auth token || cloud functions firestore event data

  const time = new Date()
  const initBalance = 500

  console.log(`creating user: ${uid} - ${email} - ${name}`)

  // increase market cap
  const metaDoc = await t.get(metaRef)
  t.update(metaRef, {cap: metaDoc.data().cap + initBalance})

  // create the first transaction for the user
  const txRef = txsRef.doc()
  t.create(txRef, {from: 'majorna', to: uid, sent: time, amount: initBalance})

  // create user doc
  t.create(usersRef.doc(uid), {
    email: email,
    name: name,
    created: time,
    balance: initBalance,
    txs: [
      {
        id: txRef.id,
        from: 'majorna',
        sent: time,
        amount: initBalance
      }
    ]
  })
})

/**
 * Get a transaction from transactions collection by ID, asynchronously.
 */
exports.getTx = async id => {
  const tx = await txsRef.doc(id).get()
  return tx.exists ? tx.data() : null
}

/**
 * Performs a financial transaction from person A to B asynchronously.
 * Both user documents and transactions collection is updated with the transaction data and results.
 * Returned promise resolves to an error if transaction fails.
 */
exports.makeTx = (from, to, sent, amount) => firestore.runTransaction(async t => {
  // verify sender's funds
  const senderDoc = await t.get(usersRef.doc(from))
  const sender = senderDoc.data()
  if (!senderDoc.exists || sender.balance < amount) {
    throw new Error('insufficient funds')
  }

  // check if receiver exists
  const receiverDoc = await t.get(usersRef.doc(to))
  const receiver = receiverDoc.data()
  if (!receiverDoc.exists) {
    throw new Error('receiver does not exist')
  }

  // add tx to txs collection
  const txRef = txsRef.doc()
  t.create(txRef, {from, to, sent, amount})

  // update user docs with tx and updated balances
  sender.txs.unshift({id: txRef.id, to, sent, amount})
  t.update(senderDoc, {balance: sender.balance - amount, txs: sender.txs})
  receiver.txs.unshift({id: txRef.id, from, sent, amount})
  t.update(receiverDoc, {balance: receiver.balance + amount, txs: receiver.txs})
})

/**
 * Deletes all the data and seeds the database with dummy data for testing, asynchronously.
 */
exports.initTest = async () => {
  const testData = require('../config/test').data
  const batch = firestore.batch()

  // delete all data
  const txsSnap = await txsRef.get()
  txsSnap.forEach(txSnap => batch.delete(txSnap.ref))
  const usersSnap = await usersRef.get()
  usersSnap.forEach(userSnap => batch.delete(userSnap.ref))
  batch.delete(metaRef)

  // add seed data
  batch.create(metaRef, testData.mj.meta)
  batch.create(usersRef.doc('1'), testData.users.u1Doc)
  batch.create(usersRef.doc('2'), testData.users.u2Doc)

  await batch.commit()
}
