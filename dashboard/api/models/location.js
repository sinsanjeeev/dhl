const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const Location=seqconn.define('dhl_site_location',{
    location_id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    location_name:Sequelize.STRING,
    locationz:Sequelize.DECIMAL,
    site_id:Sequelize.INTEGER,
    locationxy_coordinate:Sequelize.JSONB,
    is_logical:Sequelize.STRING,
    is_multipolygon:Sequelize.STRING,
    parent_location: {
		type: Sequelize.INTEGER
	}
},{
    timestamps: false,
    freezeTableName: true
});
Location.belongsTo(Location, {as: 'parent_name', foreignKey: 'parent_location'})
Location.belongsTo(Site,{foreignKey: 'site_id'})
module.exports=Location