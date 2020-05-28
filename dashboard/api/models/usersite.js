const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')

const UserSite=seqconn.define('dhl_user_site',{
    user_id:Sequelize.INTEGER,
    site_id:Sequelize.INTEGER
},{
    timestamps: false,
    freezeTableName: true
});

//SiteImages.belongsTo(Site,{foreignKey: 'site_id'})
module.exports=UserSite