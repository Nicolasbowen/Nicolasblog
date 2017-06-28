
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var setting = require('./setting');


require('events').EventEmitter.defaultMaxListeners = Infinity;

//引入路由文件
var routes = require('./routes/index');
var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//使用flash模块
app.use(flash());
//使用session，并且进行参数配置
app.use(session({
    //引入一下配置文件中为session加密的字符串
    secret:setting.cookieSecret,
    //设置key值
    key:setting.db,
    //设置过期时间
    cookie:{maxAge:60*60*24*30*1000},
    //将session存放到数据库里面.
    store:new MongoStore({
      url:'mongodb://localhost/newblog'
    }),
    //每次访问的时候并不重新保存数据
    resave:false,
    //
    saveUninitialized:true
}))

routes(app);
/*app.use('/', index);
app.use('/users', users);*/

// catch 404 and forward to error handler
//处理404页面的提示信息
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
//处理错误的提示信息
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//添加一句启动的命令，让应用启动起来.
app.listen(3000,function(){
  console.log('node is OK');
})
module.
    exports = app;