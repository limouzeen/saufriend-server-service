const Sequelize = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
});

sequelize.sync().then(()=> {
    console.log('Database connection has been successfully established');
}).catch(error => {
    console.error('Unable to connect to the database:', err);
});

module.exports = sequelize;