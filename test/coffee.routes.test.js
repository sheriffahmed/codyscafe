/* eslint-env mocha, chai */

const { expect } = require('chai');
const sinon = require('sinon');
const supertest = require('supertest');
const app = require('../server/app');
const agent = supertest.agent(app);
const seed = require('./test-seed');
const { Coffee } = require('../server/models');

describe('Routes', () => {
  // Make sure to check out test/test-seed.js
  // This file drops the database and re-creates the dummy data
  // used by the tests.
  let puppaccino, mocha;

  beforeEach(async () => {
    const [puppaccinoFromDb, mochaFromDb] = await seed();
    puppaccino = puppaccinoFromDb;
    mocha = mochaFromDb;
  });

  describe('/coffee', () => {
    describe('GET /coffee', () => {
      it('sends all coffee', async () => {
        const res = await agent
          .get('/api/coffee')
          .expect(200)
        expect(res.body).to.be.an('array');
        expect(
          res.body.some(coffee => coffee.name === puppaccino.name)
        ).to.equal(true);
        expect(
          res.body.some(coffee => coffee.name === mocha.name)
        ).to.equal(true);
      });
    });

    describe('GET /coffee/ingredients/:ingredientName', async () => {
      // Be careful about the order in which you register your routes!
      // Don't forget that Express evaluates them in the order in which they're defined!
      // Arf!
      it('sends all coffee based on the specified favorite coffe name', async () => {
        const res = await agent
          .get('/api/coffee/ingredients/frothed-milk')
          .expect(200)
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.equal(1);
        expect(
          res.body.some(coffee => coffee.name === puppaccino.name)
        ).to.equal(true);

        const res2 = await agent
          .get('/api/coffee/ingredients/hot-cocoa')
          .expect(200)
        expect(res2.body).to.be.an('array');
        expect(res2.body.length).to.equal(1);
        expect(
          res2.body.some(coffee => coffee.name === mocha.name)
        ).to.equal(true);

        const res3 = await agent
          .get('/api/coffee/ingredients/love')
          .expect(200)
        expect(res3.body).to.be.an('array');
        expect(res3.body.length).to.equal(2);
        expect(
          res3.body.some(coffee => coffee.name === mocha.name)
        ).to.equal(true);
        expect(
          res3.body.some(coffee => coffee.name === puppaccino.name)
        ).to.equal(true);
      });

      it('calls the Coffee.findByIngredient class method', async () => {
        sinon.spy(Coffee, 'findByIngredient');
        try {
          await agent
            .get('/api/coffee/ingredients/frothed-milk')
            .expect(200)
          expect(Coffee.findByIngredient.calledOnce).to.equal(true);
          expect(Coffee.findByIngredient.calledWith('frothed-milk'));
          Coffee.findByIngredient.restore();
        } catch (err) {
          Coffee.findByIngredient.restore();
          throw err;
        }
      });
    });

    describe('GET /coffee/:coffeeId', () => {
      it('gets the coffee with the specified id', async () => {
        const res = await agent
          .get(`/api/coffee/${puppaccino.id}`)
          .expect(200)
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal(puppaccino.name);

        const res2 = await agent
          .get(`/api/coffee/${mocha.id}`)
          .expect(200)
        expect(res2.body).to.be.an('object');
        expect(res2.body.name).to.equal(mocha.name);
      });

      it('sends a 404 if not found', () => {
        return agent.get(`/api/coffee/20`).expect(404);
      });
    });

    describe('POST /coffee', () => {
      it('creates a new coffee and sends back the new coffee', async () => {
        const res = await agent
          .post('/api/coffee')
          .send({
            name: 'Frappe'
          })
          .expect(201)
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal('Frappe');

        const frappe = await Coffee.findOne({
              where: {
                name: 'Frappe'
              }
            });
        expect(frappe).to.be.an('object');
        expect(frappe.name).to.equal('Frappe');
      });
    });
  });
});
