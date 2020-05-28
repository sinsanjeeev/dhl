const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')
const Site=require('./site')
const SiteImages=seqconn.define('dhl_site_images',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    image:Sequelize.TEXT,
    site_id:Sequelize.STRING,
    image_name:Sequelize.STRING,
    image_type:Sequelize.STRING
},{
    timestamps: false,
    freezeTableName: true
});

module.exports=SiteImages