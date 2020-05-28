const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')

const UserRole=seqconn.define('dhl_user_role',{
    user_id:Sequelize.INTEGER,
    role_id:Sequelize.INTEGER
},{
    timestamps: false,
    freezeTableName: true
});

//SiteImages.belongsTo(Site,{foreignKey: 'site_id'})
module.exports=UserRole