const mongoose = require('mongoose')

const EMAIL_VALIDATION_STATUSES = {
  VALID: 'valid',
  INVALID: 'invalid',
  ACCEPT_ALL_UNVERIFIABLE: 'accept_all_unverifiable',
  UNKNOWN: 'unknown',
  DISPOSABLE: 'disposable',
  CATCHALL: 'catchall',
  BAD_SYNTAX: 'badsyntax',
  UNVERIFIABLE: 'unverifiable',
  ALL: [
    'valid',
    'invalid',
    'accept_all_unverifiable',
    'unknown',
    'disposable',
    'catchall',
    'badsyntax',
    'unverifiable',
  ],
}

const emailSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  status: { type: String, enum: EMAIL_VALIDATION_STATUSES.ALL },
  created: { type: Date, default: Date.now() },
})

const Emails = mongoose.model('Email', emailSchema, 'emails')

module.exports = {
  EMAIL_VALIDATION_STATUSES,
  Emails,
}
