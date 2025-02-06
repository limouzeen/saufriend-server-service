const Sequelize = require('sequelize');
const sequelize = require('../db/db.js');
const User = require('./user.model.js'); 

const MyFriend = sequelize.define('myfriend_tb', {
    myfriendId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        field: "myfriendId"
    },
    myfriendFullname: {
        type: Sequelize.STRING(100),
        allowNull: false,
        field: "myfriendFullname"
    },
    myfriendPhone: {
        type: Sequelize.STRING(10),
        allowNull: false,
        field: "myfriendPhone"
    },
    myfriendAge: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "myfriendAge"
    },
    myfriendMajor: {
        type: Sequelize.ENUM('IoT', 'DTI', 'IT'),
        allowNull: false,
        field: "myfriendMajor"
    },
    myfriendImage: {
        type: Sequelize.STRING(150),
        allowNull: false,
        field: "myfriendImage"
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "userId",
        references: {
            model: User,
            key: "userId"
        }
    }
},
{
    tableName: "myfriend_tb",
    timestamps: false,
    freezeTableName: true,
});

// Define foreign key relationship
User.hasMany(MyFriend, { foreignKey: "userId" });
MyFriend.belongsTo(User, { foreignKey: "userId" });

module.exports = MyFriend;
