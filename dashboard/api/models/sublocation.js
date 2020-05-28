const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const Location=require('./location')
const SubLocation=seqconn.define('dhl_site_subarea_location',{
    sub_location_id:{
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    location_name:Sequelize.STRING,
    locationz:Sequelize.DECIMAL,
    site_id:Sequelize.INTEGER,
    locationxy_coordinate:Sequelize.JSONB,
    parent_id: {
		type: Sequelize.INTEGER
	}
},{
    timestamps: false,
    freezeTableName: true
});

SubLocation.belongsTo(Site,{foreignKey: 'site_id'})
SubLocation.belongsTo(Location,{foreignKey: 'parent_id'})
module.exports=SubLocation