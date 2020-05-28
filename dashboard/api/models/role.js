const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const AppModule=require('./appmodule')
const RoleModule=require('./rolemodule')
const Role=seqconn.define('dhl_role',{
    role_id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role_name:Sequelize.STRING,
    role_description:Sequelize.STRING
},{
    timestamps: false,
    freezeTableName: true
});
Role.belongsToMany(AppModule, { through: 'dhl_role_module', foreignKey: 'role_id',
otherKey: 'module_id',timestamps: false});
AppModule.belongsToMany(Role, { through: 'dhl_role_module', foreignKey: 'module_id',
otherKey: 'role_id',timestamps: false});
Role.hasMany(RoleModule,{foreignKey: 'role_id', onDelete: "CASCADE"})
module.exports=Role