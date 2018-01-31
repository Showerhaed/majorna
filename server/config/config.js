const firebaseAdmin = require('firebase-admin')

const env = process.env.NODE_ENV || (process.env.CI && 'test') || 'development'

// app config
const app = {
  env,

  isProd: env === 'production',
  isDev: env === 'development',
  isTest: env === 'test',
  isCloudFn: false, // if "require('firebase-functions').config().firebase" is defined

  port: process.env.PORT || 3001
}

// firebase config
const fb = {
  serviceKeyJsonPath: process.env.FIREBASE_JSON_PATH,
  testServiceKeyJsonPath: process.env.FIREBASE_TEST_JSON_PATH, // test (admin sdk) only
  testClientSdkKeyJsonPath: process.env.FIREBASE_CLIENT_TEST_JSON_PATH, // test (client sdk) only
  credentials: null,
  config: {
    credential: null
  }
}

if (app.isTest) { // test config with config file
  console.log('config: firebase: test mode')
  const serviceJson = require(fb.testServiceKeyJsonPath)
  fb.credentials = firebaseAdmin.credential.cert(serviceJson)
  fb.config = {credential: fb.credentials}
} else if (app.isCloudFn) { // Google Cloud Functions
  console.log('config: firebase: cloud functions mode')
  fb.config = require('firebase-functions').config().firebase
} else if (fb.serviceKeyJsonPath) { // local or manual configuration
  console.log('config: firebase: local/manual mode')
  const serviceJson = require(fb.serviceKeyJsonPath)
  fb.credentials = firebaseAdmin.credential.cert(serviceJson)
  fb.config = {credential: fb.credentials}
} else { // Google Compute Engine
  console.log('config: firebase: gce mode')
  // required GCE access scopes for default credentials to work: https://firebase.google.com/docs/admin/setup
  fb.credentials = firebaseAdmin.credential.applicationDefault()
  fb.config = {credential: fb.credentials}
}

// module exports
module.exports = {
  app,
  firebase: fb
}
