const Sequelize=require("sequelize")
const seqconn=require('../../util/dbutil')

const AppModule=seqconn.define('dhl_module',{
    module_id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    module_name:Sequelize.STRING,
    module_description:Sequelize.STRING
},{
    timestamps: false,
    freezeTableName: true
});

module.exports=AppModule