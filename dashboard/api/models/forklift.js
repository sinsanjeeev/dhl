const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const Location=require('./location')
const ForkliftState=seqconn.define('dhl_forklift_device_state',{
    device_id:{
        type: Sequelize.STRING,
        primaryKey: true
    },
    device_timestamp:Sequelize.DATE,
    location_id:Sequelize.INTEGER,
    site_id:Sequelize.INTEGER,
    updated_utc:Sequelize.DATE,
    locationxy:Sequelize.JSONB,
    locationz:Sequelize.DECIMAL
},{
    timestamps: false,
    freezeTableName: true
});
ForkliftState.belongsTo(Site,{foreignKey: 'site_id'})
ForkliftState.belongsTo(Location,{foreignKey: 'location_id'})
module.exports=ForkliftState