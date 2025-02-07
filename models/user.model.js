const Sequelize = require('sequelize');
const sequelize = require('../db/db.js');

const User = sequelize.define('user_tb', {
    userId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        field: "userId"
    },
    userFullname: {
        type: Sequelize.STRING(100),
        allowNull: false,
        field: "userFullname"
    },
    userEmail: {
        type: Sequelize.STRING(100),
        allowNull: false,
        field: "userEmail"
    },
    userName: {
        type: Sequelize.STRING(50),
        allowNull: false,
        field: "userName"
    },
    userPassword: {
        type: Sequelize.STRING(60),
        allowNull: false,
        field: "userPassword"
    },
    userImage: {
        type: Sequelize.STRING(150),
        allowNull: false,
        field: "userImage"
    },userStatus: {  
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1, // 1 = Active, 0 = Inactive
        field: "userStatus"
    }
},
{
    tableName: "user_tb",
    timestamps: false,
    freezeTableName: true,
});

module.exports = User;
