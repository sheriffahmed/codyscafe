// do not modify this file
const {db, Pug, Coffee} = require('../server/models')

module.exports = async () => {
  await db.sync({ force: true });

  const [coffee1, coffee2] = await Promise.all([
    Coffee.create({
      name: 'puppaccino',
      ingredients: ['espresso', 'frothed-milk', 'love'],
    }),
    Coffee.create({
      name: 'mocha',
      ingredients: ['espresso', 'hot-cocoa', 'whipped-cream', 'love'],
    }),
  ]);

  const [cody, doug, penny] = await Promise.all([
    Pug.create({
      name: 'Cody',
      age: 7,
    }),
    Pug.create({
      name: 'Doug',
    }),
    Pug.create({
      name: 'Penny',
    }),
  ]);

  // Sequelize Magic Methods
  // https://sequelize.org/master/manual/assocs.html#note--method-names
  // or this really nice medium article
  // https://medium.com/@julianne.marik/sequelize-associations-magic-methods-c72008db91c9
  await cody.setFavoriteCoffee(coffee1);
  await doug.setFavoriteCoffee(coffee2);
  await penny.setFavoriteCoffee(coffee1);

  return [coffee1, coffee2, cody, doug, penny];
}
