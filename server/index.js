const server = require('./config/server')
const blockchain = require('./blockchain/blockchain')

server().then(() => blockchain.startBlockchainInsertTimer())
