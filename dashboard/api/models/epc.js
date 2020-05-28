const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const Location=require('./location')
const EpcState=seqconn.define('dhl_epc_state',{
    epc:{
        type: Sequelize.STRING,
        primaryKey: true
    },
    rfid_timestamp:Sequelize.DATE,
    location_id:Sequelize.INTEGER,
    site_id:Sequelize.INTEGER,
    device_id:Sequelize.STRING,
    reference_number:Sequelize.STRING,
    locationxy:Sequelize.JSONB,
    locationxy:Sequelize.DECIMAL,
    is_shipped:Sequelize.STRING,
    warehouse_in_time:Sequelize.DATE,
    warehouse_out_time:Sequelize.DATE
},{
    timestamps: false,
    freezeTableName: true
});
EpcState.belongsTo(Site,{foreignKey: 'site_id'})
EpcState.belongsTo(Location,{foreignKey: 'location_id'})
module.exports=EpcState