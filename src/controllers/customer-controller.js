const customerService = require('../services/customer-service')
const Customer = require('../models/customer')
const Email = require('../models/email')
const Phone = require('../models/phone')
const Address = require('../models/address')
const BusinessPartner = require('../models/business-partner')
const Vehicle = require('../models/vehicle')
const { searchCustomer } = require('../helpers/elastic')

const newCustomer = new Customer()
const newEmail = new Email()
const newPhone = new Phone()
const newAddress = new Address()
const newBusinessPartner = new BusinessPartner()
const newVehicle = new Vehicle()

class CustomerController {
  async createBatch(req, res) {
    const customers = req.body.customers
    const businessId  = req.body.business_id
    const businessTemplateId = req.body.business_template_id
    const listKeyFields = req.body.field_key_list
    const prefixIndexElastic = req.body.prefix_index_elastic

    const companyToken = req.headers['token']

    if (companyToken.length === 0) return res.status(500).send({ err: "Company Token inválido." })

    await customerService.schedulePersist(customers, companyToken, [businessId], [businessTemplateId], listKeyFields, prefixIndexElastic)

    res.status(201).send(req.body)
  }

  async create(req, res) {
    req.assert('customer_cpfcnpj', 'O CPF/CNPJ é obrigatório').notEmpty()
    req.assert('prefix_index_elastic', 'O prefix index elastic é obrigatório').notEmpty()
    
    if (req.validationErrors()) return res.status(500).send({ errors: req.validationErrors() })

    const companyToken = req.headers['token']

    if (companyToken.length === 0) return res.status(500).send({ err: "Company Token inválido." })

    try {
      var customer = await newCustomer.getByCpfCnpj(req.body.customer_cpfcnpj, companyToken)
      if (customer) return res.status(400).send({ err: "Já existe um cadastro com este CPF/CNPJ." })

      const customers = [req.body]
      
      await customerService.schedulePersist(customers, companyToken, [], [], ['customer_cpfcnpj'], req.body.prefixIndexElastic)

      res.status(201).send(req.body)
    } catch (err) {
      return res.status(500).send({ err: err.message })
    }
  }

  async search (req, res) {
    const companyToken = req.headers['token']
    const prefixIndexElastic = req.headers['prefix-index-elastic']
    try {
      const result = await searchCustomer(req.query.search, prefixIndexElastic)
      var customers = []
      if (result && result.length > 0) customers = result.map(r => r._source.doc)
      var customers_ids = customers.map(c => c.id).filter((value, index, self) => self.indexOf(value) === index)

      var list_customers = await newCustomer.listById(customers_ids, companyToken)
      var customersResult = []
      
      customers_ids.forEach(cid => {
        var customerCache = customers.find(c => c.id == cid)
	      var customer1 = list_customers.find(cus => cus.id == cid)
        if (customer1) {
          customerCache.business_list = customer1.business_list
          customerCache.business_template_list = customer1.business_template_list

          customersResult.push(customerCache)
        }
      })
      return res.status(200).send(customers)
    } catch (err) {
      return res.status(500).send({ err: err.message })
    }
  }

  async getById (req, res) {
    const companyToken = req.headers['token']

    try {
      var customer = await newCustomer.getById(req.params.id, companyToken)
      if (customer) {
        customer.email = await newEmail.getAllByCustomer(customer.id)
        customer.address = await newAddress.getAllByCustomer(customer.id)
        customer.phone = await newPhone.getAllByCustomer(customer.id)
        customer.business_partner = await newBusinessPartner.getAllByCustomer(customer.id)
        customer.vehicle = await newVehicle.getAllByCustomer(customer.id)
      }
      return res.status(200).send(customer)
    } catch (err) {
      return res.status(500).send({ err: err.message })
    }
  }

  async getByCpfCnpj (req, res) {
    const companyToken = req.headers['token']

    try {
      var customer = await newCustomer.getByCpfCnpj(req.query.cpfcnpj, companyToken)
      if (customer) {
        customer.email = await newEmail.getAllByCustomer(customer.id)
        customer.address = await newAddress.getAllByCustomer(customer.id)
        customer.phone = await newPhone.getAllByCustomer(customer.id)
        customer.business_partner = await newBusinessPartner.getAllByCustomer(customer.id)
        customer.vehicle = await newVehicle.getAllByCustomer(customer.id)
      }
      return res.status(200).send(customer)
    } catch (err) {
      return res.status(500).send({ err: err.message })
    }
  }

  async getAllByCompany(req, res) {
    const companyToken = req.headers['token']

    try {
      var listCustomers = []
      var customers = await newCustomer.getAllByCompany(companyToken)
      var listCustomers = await Promise.all(customers.map(async el => {
        var customer = el
        customer.email = await newEmail.getAllByCustomer(customer.id)
        customer.phone = await newPhone.getAllByCustomer(customer.id)
        return customer
      }))

      return res.status(200).send(listCustomers)
    } catch (err) {
      return res.status(500).send({ err: err.message })
    }
  }

  async update (req, res) {
    const companyToken = req.headers['token']

    try {
      const customer = await newCustomer.getById(req.params.id, companyToken)
      if (!customer) return req.status(400).send({ err: "Customer não encontrado." })

      var customerUpdate = req.body
      customerUpdate.customer_cpfcnpj = customer.cpfcnpj
      const customers = [customerUpdate]
      
      await customerService.schedulePersist(customers, companyToken, [], [])
      
      return res.sendStatus(200)
    } catch (err) {
      return res.status(500).send({ err: err.message })
    }
  }
}

module.exports = CustomerController
