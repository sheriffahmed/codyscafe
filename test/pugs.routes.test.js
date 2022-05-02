/* eslint-env mocha, chai */

const { expect } = require('chai');
const sinon = require('sinon');
const supertest = require('supertest');
const app = require('../server/app');
const agent = supertest.agent(app);
const seed = require('./test-seed');
const { Pug } = require('../server/models');

// NOTE: there is some dependency on your Pug and Coffee model
// for the Routes test to work. At minimum, you will need to define
// their schema and associations
describe('Routes', () => {
  // Make sure to check out test/test-seed.js
  // This file drops the database and re-creates the dummy data
  // used by the tests.
  let puppaccino, mocha, cody, doug, penny;

  beforeEach(async () => {
    // Yum! My favorite is Puppaccino!
    const [
      seededPuppaccino,
      seededMocha,
      seededCody,
      seededDoug,
      seededPenny
    ] = await seed()
    puppaccino = seededPuppaccino;
    mocha = seededMocha;
    cody = seededCody;
    doug = seededDoug;
    penny = seededPenny;
  });

  describe('/pugs', () => {
    describe('GET /pugs', () => {
      it('sends all pugs', async () => {
        const res = await agent
          .get('/api/pugs')
          .expect(200)
        expect(res.body).to.be.an('array');
        expect(res.body.some(pug => pug.name === 'Cody')).to.equal(true);
        expect(res.body.some(pug => pug.name === 'Doug')).to.equal(true);
        expect(res.body.some(pug => pug.name === 'Penny')).to.equal(true);
      });
    });

    describe('GET /pugs/favoriteCoffee/:favoriteCoffeeName', () => {
      // Be careful about the order in which you register your routes!
      // Don't forget that Express evaluates them in the order in which they're defined!
      it('sends all pugs based on the specified favorite coffe name', async () => {
        const res = await agent
          .get('/api/pugs/favoriteCoffee/puppaccino')
          .expect(200);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.equal(2);
        expect(res.body.some(pug => pug.name === 'Cody')).to.equal(true);
        expect(res.body.some(pug => pug.name === 'Penny')).to.equal(true);

        const res2 = await agent
          .get('/api/pugs/favoriteCoffee/mocha')
          .expect(200);
        expect(res2.body).to.be.an('array');
        expect(res2.body.length).to.equal(1);
        expect(res2.body.some(pug => pug.name === 'Doug')).to.equal(
          true
        );
      });

      it('calls the Pug.findByCoffee class method', async () => {
        sinon.spy(Pug, 'findByCoffee');
        try {
          await agent
            .get('/api/pugs/favoriteCoffee/puppaccino')
            .expect(200)
          expect(Pug.findByCoffee.calledOnce).to.equal(true);
          expect(Pug.findByCoffee.calledWith('puppaccino'));
          Pug.findByCoffee.restore();
        } catch (err) {
          Pug.findByCoffee.restore();
          throw err;
        };
      });
    });

    describe('GET /pugs/:pugId', () => {
      it('gets the pug with the specified id', async () => {
        const res = await agent
          .get(`/api/pugs/${cody.id}`)
          .expect(200)
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal('Cody');

        const res2 = await agent
          .get(`/api/pugs/${penny.id}`)
          .expect(200)
        expect(res2.body).to.be.an('object');
        expect(res2.body.name).to.equal('Penny');
      });

      it('sends a 404 if not found', () => {
        return agent.get(`/api/pugs/20`).expect(404);
      });
    });

    describe('POST /pugs', () => {
      it('creates a new pug and sends back the new pug', async () => {
        const res = await agent
          .post('/api/pugs')
          .send({
            name: 'Loca'
          })
          .expect(201)
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal('Loca');

        const loca = await Pug.findOne({
              where: {
                name: 'Loca'
              }
            });
        expect(loca).to.be.an('object');
        expect(loca.name).to.equal('Loca');
      });
    });

    describe('PUT /pugs/:pugId', () => {
      it('updates an existing pug', async () => {
        const res = await agent
          .put(`/api/pugs/${cody.id}`)
          .send({
            favoriteCoffeeId: mocha.id
          })
          .expect(200)
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal('Cody');
        expect(res.body.favoriteCoffeeId).to.equal(mocha.id);

        const codyFromDatabase = await Pug.findByPk(cody.id);
        expect(codyFromDatabase.favoriteCoffeeId).to.equal(mocha.id);
      });

      it('sends a 404 if not found', () => {
        return agent.put(`/api/pugs/20`).expect(404);
      });
    });

    describe('DELETE /pugs/:pugId', () => {
      it('removes a pug from the database', async () => {
        await agent
          .delete(`/api/pugs/${doug.id}`) // Oh noes! Bye, Doug!
          .expect(204)
        const maybeDoug = await Pug.findByPk(doug.id);
        expect(maybeDoug).to.equal(null);
      });

      it('sends a 404 if not found', () => {
        return agent.delete(`/api/pugs/20`).expect(404);
      });
    });
  });
});
