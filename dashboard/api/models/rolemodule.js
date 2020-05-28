const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')

const RoleModule=seqconn.define('dhl_role_module',{
    role_id:Sequelize.INTEGER,
    module_id:Sequelize.INTEGER
},{
    timestamps: false,
    freezeTableName: true
});

//SiteImages.belongsTo(Site,{foreignKey: 'site_id'})
module.exports=RoleModule