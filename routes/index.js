//路由规则全部写在这里.
//连接数据库
var mongo = require('../models/db');
//加密模块
var crypto = require('crypto');
//引入User操作类
var User = require('../models/User');
//引入Post操作类
var Post = require('../models/Post');
//引入Comment操作类
var Comment = require('../models/Comment');
//上传下载的功能
//新的使用方法配置multer
var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './public/images')
    },
    filename: function (req, file, cb){
        cb(null, file.originalname)
    }
});
var upload = multer({
    storage: storage
});
//让未登录的用户不能访问发表和退出
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录');
        res.redirect('/login');
    }
    next();
}
//让已登录的用户不能访问登录和注册
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录');
        res.redirect('back');
    }
    next();
}
module.exports = function(app){
    //首页的路由
    app.get('/',function(req,res){
        //获取到当前的页数
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null,page,function(err,posts,total){
            if(err){
                posts = [];
            }
            res.render('index',{
                title:"首页",
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                posts:posts,
                //当前页数
                page:page,
                //是否是第一页
                isFirstPage:(page - 1) == 0,
                //是否是最后一页
                isLastPage:((page - 1) * 10) + posts.length == total,
                yeshu:Math.ceil(total / 10)
            })
        })
    })
    //注册页面的路由
    app.get('/reg',checkNotLogin,function(req,res){
        res.render('reg',{
            title:'注册页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/reg',function(req,res){
        //1.收集数据
        var name = req.body.username;
        var password = req.body.password;
        var password_re = req.body['password_re'];
        //2.判断一下两次密码是否一致
        if(password !== password_re){
            req.flash('error','两次密码不一样');
            return res.redirect('/reg');
        }
        //3.密码进行加密
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');

        //整理到一个对象上去
        var newUser = new User({
            name:name,
            password:password,
            email:req.body.email
        })
        //检查用户名是否被占用
        User.get(newUser.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');
            }
            if(user){
                req.flash('error','用户名被占用');
                return res.redirect('/reg');
            }
            //把数据存放到数据库里面去
            newUser.save(function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success','注册成功');
                return res.redirect('/');
            })
        })
    })
    //登录
    app.get('/login',checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'登录页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/login',function(req,res){
        //1.对用户提交的密码进行加密处理
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //2.检查用户名是否存在
        User.get(req.body.username,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/login');
            }
            if(!user){
                req.flash('error','用户名不存在');
                return res.redirect('/login');
            }
            //3.对比密码是否一样
            if(user.password !== password){
                req.flash('error','密码错误');
                return res.redirect('/login');
            }
            //4.最后登录成功后，把登录信息放入SESSION,提示成功，跳转首页
            req.session.user = user;
            req.flash('success','登录成功');
            return res.redirect('/');
        })


    })
    //退出
    app.get('/logout',checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success','退出成功');
        return res.redirect('/');
    })
    //发表的路由
    app.get('/post',checkLogin);
    app.get('/post',function(req,res){
        res.render('post',{
            title:"发表",
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //发表的行为
    app.post('/post',function(req,res){

        //1.获取当前登录的用户名
        var currentUser = req.session.user;
        var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        var post = new Post(currentUser.name, req.body.title, tags, req.body.post);

        post.save(function(err){
            if(err){
                req.flash('error','发表失败');
                return res.redirect('/post');
            }
            req.flash('success','发表成功');
            return res.redirect('/');
        })
    })
    //上传的页面
    app.get('/upload',checkLogin);
    app.get('/upload',function(req,res){
        res.render('upload',{
            title:'上传页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //上传的行为
    app.post('/upload',upload.array('field1',5),function(req,res){
        req.flash('success','上传成功');
        res.redirect('/upload');
    })
    //存档的路由规则
    app.get('/archive', function (req, res) {
        Post.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //标签的路由规则
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag, function (err, posts) {
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //查询用户发布文章列表的路由
    app.get('/u/:name',function(req,res){
        //当前页数
        var page = parseInt(req.query.p) || 1;
        User.get(req.params.name,function(err,user){
            if(err){
                req.flash('error',err);
                res.redirect('/');
            }
            if(!user){
                req.flash('error','用户名不存在');
                res.redirect('/');
            }
            Post.getTen(user.name,page,function(err,total,posts){
                if(err){
                    req.flash('error',err);
                    res.redirect('/');
                }
                res.render('user',{
                    title:'用户文章列表',
                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString(),
                    posts:posts,
                    page:page,
                    isFirstPage:(page - 1) == 0,
                    isLastPage:((page - 1)*10) + posts.length == total
                })
            })

        })
    })
    //文章页面的路由
    app.get('/u/:name/:minute/:title',function(req,res){
        Post.getOne(req.params.name,req.params.minute,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                res.redirect('/');
            }
            res.render('article',{
                title:'文章详情页面',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                post:post
            })
        })
    })
    //添加编辑路由
    app.get('/edit/:name/:minute/:title',checkLogin);
    app.get('/edit/:name/:minute/:title',function(req,res){
        Post.edit(req.params.name,req.params.minute,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                res.redirect('back');
            }
            res.render('edit',{
                title:"编辑页面",
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                post:post
            })
        })
    })
    //修改行为
    app.post('/edit/:name/:minute/:title',checkLogin);
    app.post('/edit/:name/:minute/:title',function(req,res){
        Post.update(req.params.name,req.params.minute,req.params.title,req.body.post,function(err){
            var url = '/u/'+ req.params.name + '/' + req.params.minute + '/' + req.params.title;
            if(err){
                req.flash('error',err);
                res.redirect(url);
            }
            req.flash('success','发布成功');
            res.redirect(url);
        })
    })
    app.get('/remove/:name/:minute/:title',checkLogin);
    app.get('/remove/:name/:minute/:title',function(req,res){
        Post.remove(req.params.name,req.params.minute,req.params.title,function(err){
            if(err){
                req.flash('error',err);
                res.redirect('back');
            }
            req.flash('success','删除成功');
            res.redirect('/');
        })
    })
    app.post('/comment/:name/:minute/:title',function(req,res){
        var date = new Date();
        var time = date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1 ) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
            (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
        var comment = {
            name:req.body.name,
            time:time,
            content:req.body.content
        }
        var newComment = new Comment(req.params.name,req.params.minute,req.params.title,comment);
        newComment.save(function(err){
            if(err){
                req.flash('error',err);
                res.redirect('back');
            }
            req.flash('success','留言成功');
            res.redirect('back');
        })
    })
}