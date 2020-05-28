const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const DeviceState=seqconn.define('dhl_device_status_state',{
    device_id:{
        type: Sequelize.STRING,
        primaryKey: true
    },
    device_type:Sequelize.STRING,
    uwb_status:Sequelize.STRING,
    site_id:Sequelize.INTEGER,
    rfid_status:Sequelize.STRING,
    compute_model_status:Sequelize.STRING,
    compute_model_telemetry:Sequelize.JSONB,
    device_timestamp:Sequelize.DATE,
    gw_timestamp:Sequelize.DATE,
    mode:Sequelize.STRING
},{
    timestamps: false,
    freezeTableName: true
});
DeviceState.belongsTo(Site,{foreignKey: 'site_id'})

module.exports=DeviceState