const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const SiteImages=require('./siteimages')
const Site=seqconn.define('dhl_site',{
    site_id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    site_code:Sequelize.STRING,
    site_name:Sequelize.STRING,
    site_address:Sequelize.STRING,
    enterprise_id:Sequelize.INTEGER,
    site_coordinate:Sequelize.JSONB,
    city:Sequelize.STRING
},{
    timestamps: false,
    freezeTableName: true
});
Site.hasMany(SiteImages,{foreignKey: 'site_id'})
//SiteImages.belongsTo(Site,{foreignKey: 'site_id'})
module.exports=Site