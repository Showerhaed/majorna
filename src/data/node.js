exports.receiveTxs = () => {
  // no duplicates
  // no balance below 0
  // valid signatures
}

exports.receiveBlock = () => {
  // validate each tx signature unless block is signed by a trusted key
}

exports.initSimplePeer = () => {}