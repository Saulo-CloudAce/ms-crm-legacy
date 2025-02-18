const RabbitMQ = require('../config/rabbitmq')

async function sendToQueuePersistCustomer(msg = {}, customers = []) {
  if (process.env.STATE_ENV === 'testing') return true

  try {
    const conn = await createConn()

    const queue = 'mscrm:persist_customer'

    for (let customer of customers) {
      const data = msg
      data.customers = [customer]

      const channel = await createChannel(conn)
      channel.assertQueue(queue, { durable: true })
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), { persistent: true })
      closeChannel(channel)
      console.info('message published on businessId:', msg.businessId[0], 'and companyToken:', msg.companyToken)
    }

    return true
  } catch (error) {
    console.error('ERRO AO PUBLICAR MENSAGEM NA FILA  ==>>', error)
    return false
  }
}

async function sendToQueueUpdateCPC(cpcData = {}) {
  if (process.env.STATE_ENV === 'testing') return true

  try {
    // const conn = await createConn()

    // const queue = 'msbusiness:update_cpc_customer'

    // const channel = await createChannel(conn)
    // channel.assertQueue(queue, { durable: true })
    // channel.sendToQueue(queue, Buffer.from(JSON.stringify(cpcData)), { persistent: true })
    // closeChannel(channel)
    // console.info('message cpc published on businessId:', cpcData.businessId, 'and companyToken:', cpcData.companyToken)

    return true
  } catch (error) {
    console.error('ERRO AO PUBLICAR MENSAGEM NA FILA  ==>>', error)
    return false
  }
}

async function createConn() {
  return await RabbitMQ.newConnection()
}

async function createChannel(conn = {}) {
  return new Promise((resolve, reject) => {
    conn.createChannel((err, ch) => {
      if (err) {
        console.error('Erro ao criar fila', err)
        reject(err)
      }

      resolve(ch)
    })
  })
}

function closeChannel(ch = {}) {
  setTimeout(() => {
    ch.close()
  }, 1000)
}

module.exports = { sendToQueuePersistCustomer, sendToQueueUpdateCPC }
