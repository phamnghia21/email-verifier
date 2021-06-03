'use strict'

const amqplib = require('amqplib')
const dotenv = require('dotenv')
const { bulk, single } = require('./api')
const { debugBase } = require('./utils')

dotenv.config()

const { NODE_ENV, RABBITMQ_HOST = 'amqp://localhost' } = process.env

let conn
let channel

const initConsumer = async () => {
  try {
    conn = await amqplib.connect(RABBITMQ_HOST)
    channel = await conn.createChannel()

    // listen for api ===========
    await channel.assertQueue('api:email-verifier-notification')

    channel.consume('api:email-verifier-notification', async msg => {
      if (msg !== null) {
        const { action, data } = JSON.parse(msg.content.toString())

        debugBase(`Receiving queue data from api`, action, data)

        if (action === 'emailVerify') {
          const { emails, email } = data
          email ? single(email) : bulk(emails)
        }

        channel.ack(msg)
      }
    })
  } catch (e) {
    debugBase(e.message)
  }
}

const sendMessage = async (queueName, data) => {
  if (NODE_ENV === 'test') {
    return
  }

  debugBase(`Sending data from email verifier to ${queueName}`, data)

  try {
    await channel.assertQueue(queueName)
    await channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(data || {})),
    )
  } catch (e) {
    debugBase(e.message)
  }
}

module.exports = {
  initConsumer,
  sendMessage,
}
