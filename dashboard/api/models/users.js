const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Role=require('./role')
const Site=require('./site')
const UserRole=require('./userrole')
const UserSite=require('./usersite')
const User=seqconn.define('dhl_usres',{
    user_id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_name:Sequelize.STRING,
    site_id:Sequelize.INTEGER,
    email:Sequelize.STRING
},{
    timestamps: false,
    freezeTableName: true
});
User.belongsToMany(Role, { through: 'dhl_user_role', foreignKey: 'user_id',
otherKey: 'role_id',timestamps: false});
Role.belongsToMany(User, { through: 'dhl_user_role',foreignKey: 'role_id',
otherKey: 'user_id',timestamps: false});

User.belongsToMany(Site, { through: 'dhl_user_site', foreignKey: 'user_id',
otherKey: 'site_id',timestamps: false});
Site.belongsToMany(User, { through: 'dhl_user_site',foreignKey: 'site_id',
otherKey: 'user_id',timestamps: false});

//User.belongsTo(Site,{foreignKey: 'site_id'})
User.hasMany(UserRole,{foreignKey: 'user_id', onDelete: "CASCADE"})
User.hasMany(UserSite,{foreignKey: 'user_id', onDelete: "CASCADE"})
//SiteImages.belongsTo(Site,{foreignKey: 'site_id'})
module.exports=User