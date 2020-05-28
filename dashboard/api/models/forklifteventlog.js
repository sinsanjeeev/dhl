const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const Location=require('./location')
const ForkliftState=seqconn.define('dhl_forklift_device_event_log',{
    device_id:{
        type: Sequelize.STRING,
        primaryKey: true
    },
    device_timestamp:Sequelize.DATE,
    from_location_id:Sequelize.INTEGER,
    to_location_id:Sequelize.INTEGER,
    site_id:Sequelize.INTEGER,
    updated_utc:Sequelize.DATE,
    locationxy:Sequelize.JSONB
},{
    timestamps: false,
    freezeTableName: true
});
ForkliftState.belongsTo(Site,{foreignKey: 'site_id'})
ForkliftState.belongsTo(Location,{foreignKey: 'from_location_id',targetKey:'location_id'})
ForkliftState.belongsTo(Location,{foreignKey: 'to_location_id',targetKey:'location_id'})
module.exports=ForkliftState