/**
 * GitHub Integration:
 * - API v3 ref: https://developer.github.com/v3/repos/contents/
 * - Node.js SDK: https://github.com/octokit/rest.js
 * - Node.js SDK ref: https://octokit.github.io/rest.js/#api-Repos-getContent
 */
const crypto = require('crypto')
const octokit = require('@octokit/rest')()
const axios = require('axios')
const config = require('../config/config')

// token auth (https://github.com/settings/tokens)
octokit.authenticate({
  type: 'token',
  token: config.github.token
})

// github api params
const owner = config.github.owner
const repo = config.github.repo

/**
 * Creates a file with given data if it does not exist.
 * Updates the file with the data if it exists.
 * @param path - Path of the file in git repo.
 * @param text - Text to be appended at the end of the file.
 */
exports.upsertFile = async (path, text) => {
  const gitbRes = await octokit.repos.getContent({owner, repo, path})
  const fileRes = await axios.get(gitbRes.data.download_url)
  const newFile = fileRes.data + '\n' + text
  const fileBuffer = Buffer.from(newFile)
  const fileBase64 = fileBuffer.toString('base64')
  const fileHasher = crypto.createHash('sha1')
  fileHasher.update(fileBuffer)

  const upGitRes = await octokit.repos.updateFile({
    owner,
    repo,
    path,
    message: 'tx',
    content: fileBase64,
    sha: fileHasher.digest('hex')
  })

  return upGitRes.status
}

/**
 * Inserts a transaction into a block.
 * @param tx - Transaction data.
 */
exports.insertTxInBlock = tx => {

}
