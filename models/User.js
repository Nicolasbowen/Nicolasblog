/**
 * Created by hama on 2017/4/7.
 */
//引入数据库的操作文件
var mongo = require('./db');
function User(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}
module.exports = User;
User.prototype.save = function(callback){
    var user = {
        name:this.name,
        password:this.password,
        email:this.email
    }
    //数据库操作
    //1.打开数据库
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(user,{safe:true},function(err,user){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null,user[0]);//返回数据的用户名.
            })
        })
    })
}
User.get = function(name,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({name:name},function(err,user){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null,user);//返回查到的用户名.
            })
        })
    })
}
