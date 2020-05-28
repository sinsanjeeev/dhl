const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const Location=require('./location')
const EpcEventLog=seqconn.define('dhl_epc_event_log',{
    epc:{
        type: Sequelize.STRING,
        primaryKey: true
    },
    rfid_timestamp:Sequelize.DATE,
    from_location_id:Sequelize.INTEGER,
    site_id:Sequelize.INTEGER,
    device_id:Sequelize.STRING,
    to_location_id:Sequelize.INTEGER,
    locationxy_coordinate:Sequelize.JSONB,    
    is_shipped:Sequelize.STRING,
    reference_number:Sequelize.STRING
},{
    timestamps: false,
    freezeTableName: true
});
EpcEventLog.belongsTo(Location,{foreignKey: 'from_location_id',targetKey:'location_id'})
EpcEventLog.belongsTo(Location,{foreignKey: 'to_location_id',targetKey:'location_id'})
EpcEventLog.belongsTo(Site,{foreignKey: 'site_id'})
module.exports=EpcEventLog