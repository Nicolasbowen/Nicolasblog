/**
 * Created by hama on 2017/4/7.
 */
//用来连接数据库，并且暴露给外部使用
var setting = require('../setting'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;
module.exports = new Db(setting.db, new Server(setting.host, setting.port),
    {safe: true});

