const moment = require('moment')
const nock = require('nock')
const app = require('../../src/config/server')
const supertest = require('supertest')
const request = supertest(app)

const companyToken = 'b61a6d542f9036550ba9c401c80f00eb'
const defaultCPF = '38686682170'
let defaultCustomerId = 4

const defaultAddress = {
  street: 'Rua Idalina',
  cep: '333350000',
  city: 'São Paulo',
  state: 'São Paulo',
  district: 'Lapa',
  type: 'Comercial'
}

async function createCustomer(customerId = 0, customer = {}) {
    return new Promise((resolve, reject) => {
      const elasticIndex = customer.prefix_index_elastic
      const newDate = moment(new Date()).format('YYYYMM')
        
      nock('http://localhost:9200')
        .intercept('\/' + `${elasticIndex}-crm-${newDate}/customer/${customerId}`, 'OPTIONS')
        .reply(200, '', {'Access-Control-Allow-Origin': '*'})
        .put('\/' + `${elasticIndex}-crm-${newDate}/customer/${customerId}`)
        .reply(200, '', {'Access-Control-Allow-Origin': '*'})
  
      request
        .post('/api/v1/customer')
        .send(customer)
        .set('Accept', 'application/json')
        .set('token', companyToken)
        .end((err) => {
          if (err) resolve()
          resolve()
        })
    })
}

describe('CRUD Customer Address', () => {
    beforeAll(async () => {
      await createCustomer(defaultCustomerId, { customer_cpfcnpj: defaultCPF, prefix_index_elastic: 'test-prefix' })
    })
    
    it('Should to create an address', async (done) => {
      request.post(`/api/v1/customers/${defaultCustomerId}/addresses`)
        .set('token', companyToken)
        .send(defaultAddress)
        .end((err, res) => {
          if (err) done(err)

          expect(res.statusCode).toBe(201)
          done()
        })
    })

    it('Should to list addresses by customer', done => {
      request.get(`/api/v1/customers/${defaultCustomerId}/addresses`)
        .set('token', companyToken)
        .end((err, res) => {
          if (err) done(err)

          expect(res.statusCode).toBe(200)
          expect(res.body[0]).toHaveProperty('id')
          expect(res.body[0]).toHaveProperty('street')
          expect(res.body[0]).toHaveProperty('cep')
          expect(res.body[0]).toHaveProperty('city')
          expect(res.body[0]).toHaveProperty('state')
          expect(res.body[0]).toHaveProperty('district')
          expect(res.body[0]).toHaveProperty('type')

          done()
        })
    })

    it('Should to update an address by id', async (done) => {
      const updatedAddress = {
        street: 'Rua Idalina - Updated',
        cep: '333350001',
        city: 'São Paulo - Updated',
        state: 'São P - Updated',
        district: 'Lapa - Updated',
        type: 'Residencial'
      }
      request.put(`/api/v1/customers/${defaultCustomerId}/addresses/6`)
        .set('token', companyToken)
        .send(updatedAddress)
        .end((err, res) => {
          if (err) done(err)

          expect(res.statusCode).toBe(200)
          expect(res.body.id).toBe(6)
          expect(res.body.street).toBe(updatedAddress.street)
          expect(res.body.cep).toBe(updatedAddress.cep)
          expect(res.body.city).toBe(updatedAddress.city)
          expect(res.body.state).toBe(updatedAddress.state)
          expect(res.body.district).toBe(updatedAddress.district)
          expect(res.body.type).toBe(updatedAddress.type)

          done()
        })
  })
})