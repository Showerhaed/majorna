const assert = require('assert')
const block = require('./block')
const testData = require('../config/test').data

const txs = testData.txs

function verifyBlock (blockObj, prevBlock, txs) {
  assert(blockObj.header.no === prevBlock.header.no + 1)
  assert(blockObj.header.prevHash.length === 44)
  assert(blockObj.header.txCount === txs.length)
  if (txs.length) {
    assert(blockObj.header.merkleRoot.length === 44)
  } else {
    assert(blockObj.header.merkleRoot === '')
  }
  assert(blockObj.header.time.getTime() <= (new Date()).getTime())
  assert(blockObj.txs.length === txs.length)

  if (blockObj.sig) {
    assert(blockObj.sig.length === 96)
    assert(block.verifySignature(blockObj))
    assert(blockObj.header.difficulty === 0)
    assert(blockObj.header.nonce === 0)
  } else {
    assert(!blockObj.sig)
    assert(blockObj.header.difficulty > 0)
    assert(blockObj.header.nonce > 0)
  }
}

suite('block', () => {
  test('toJson, fromJson', () => {
    const newBlock = block.createBlock(txs, block.getGenesisBlock())
    const blockJson = block.toJson(newBlock)
    const parsedBlock = block.fromJson(blockJson)
    assert(parsedBlock.header.time.getTime() === newBlock.header.time.getTime())
    assert(parsedBlock.txs[0].time.getTime() === newBlock.txs[0].time.getTime())
  })

  test('sign', () => {
    const signedBlock = block.createBlock(txs, block.getGenesisBlock())
    block.sign(signedBlock)
    verifyBlock(signedBlock, block.getGenesisBlock(), txs)

    // sign same thing twice and make sure that signatures turn out different (ec signing uses a random number)
    const block1 = block.createBlock(txs, block.getGenesisBlock())
    block.sign(block1)
    const block2 = block.createBlock(txs, block.getGenesisBlock())
    block.sign(block2)
    assert(block1.sig !== block2.sig)
  })

  test('getHashDifficulty', () => {
    // using Uint8Array
    const hash = new Uint8Array(3)
    hash[0] = 0
    hash[1] = 0
    hash[2] = 16
    const difficulty = block.getHashDifficulty(hash)
    assert(difficulty === 19)

    const hash2 = new Uint8Array(0)
    const difficulty2 = block.getHashDifficulty(hash2)
    assert(difficulty2 === 0)

    const hash3 = new Uint8Array(1)
    hash3[0] = 128
    const difficulty3 = block.getHashDifficulty(hash3)
    assert(difficulty3 === 0)

    // using Buffer
    const hash4 = Buffer.alloc(2)
    hash4[0] = 1
    hash4[1] = 200
    const difficulty4 = block.getHashDifficulty(hash4)
    assert(difficulty4 === 7)
  })

  test('mineBlock', () => {
    const targetDifficulty = 8
    const minedBlock = block.createBlock(txs, block.getGenesisBlock())
    const hash = block.mineBlock(minedBlock, targetDifficulty)
    verifyBlock(minedBlock, block.getGenesisBlock(), txs)

    assert(minedBlock.header.difficulty >= targetDifficulty)
    assert(hash.substring(0, 1) === 'A')
    assert(minedBlock.header.nonce > 0)
  })

  test('mineBlock with empty txs', () => {
    const emptyTxs = []
    const minedBlock = block.createBlock(emptyTxs, block.getGenesisBlock())
    block.mineBlock(minedBlock, 4)
    verifyBlock(minedBlock, block.getGenesisBlock(), emptyTxs)
  })
})