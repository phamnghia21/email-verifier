'use strict'

const dotenv = require('dotenv')
const mongoose = require('mongoose')
const debugBase = require('./utils').debugBase

dotenv.config()

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

const { MONGO_URL } = process.env

mongoose.connection
  .on('connected', () => {
    debugBase(`Connected to the database: ${MONGO_URL}`)
  })
  .on('disconnected', () => {
    debugBase(`Disconnected from the database: ${MONGO_URL}`)
  })
  .on('error', error => {
    debugBase(`Database connection error: ${MONGO_URL}`, error)
  })

const connect = URL => {
  return mongoose.connect(URL || MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
  })
}

function disconnect() {
  return mongoose.connection.close()
}

module.exports = {
  connect,
  disconnect,
}
