const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')

const SysProp=seqconn.define('dhl_system_properties',{
    // id:{
    //     type: Sequelize.INTEGER,
    //     primaryKey: true
    // },
    name:Sequelize.STRING,
    description:Sequelize.INTEGER,
    properties:Sequelize.JSONB,
    site_id:Sequelize.STRING
    
},{
    timestamps: false,
    freezeTableName: true
});
SysProp.belongsTo(Site,{foreignKey: 'site_id'})

module.exports=SysProp