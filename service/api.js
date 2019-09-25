const config = require('./config.js');
const md5 = require('blueimp-md5')();
const request = require("request-promise-native");
const app = require('express')();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
const uuidv1 = require('uuid/v1');

const MongoClient = require('mongodb').MongoClient

let db = null
MongoClient.connect('mongodb://localhost:27017/admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err, mconn) => {
    if (err) {
        console.error(err)
    }
    db = mconn.db('github-tags')
})

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");

    next()
})

app.get('/api/save', async function (req, res) {
    try {
        let token = req.query.token
        let repo_name = req.query.repo
        let tags = req.query.tags

        console.log(new Date(), "save", repo_name, tags,token)

        if (token && repo_name && tags) {
            let item = {
                _id: repo_name,
                tags: tags,
                created: new Date()
            }

            let user = await findUserByToken(token);
            if (user) {
                let table = await db.collection(user._id)
                let existing = await table.find({_id: repo_name}).limit(1).next()
                if (existing) {
                    //已经存在
                    console.debug(new Date(), "已存在，更新", item)
                    await table.updateOne({_id: repo_name}, {
                        $set: {tags: tags}
                    }, {upsert: true})
                } else {
                    await table.insertOne(item)
                    console.debug(new Date(), "新增", item)
                }

                res.json({
                    code: 200,
                    data: item
                });
            }
            return
        }

        throw {message: "标签更新失败"}
    } catch (e) {
        sendError(res, e)
    }

})


app.get('/api/get', async function (req, res) {
    let repo_name = req.query.repo
    try {
        let token = req.query.token

        console.log(new Date(), "get", repo_name)

        if (token && repo_name) {
            let user = await db.collection("user").find({uuid: token}).limit(1).next()
            if (user) {
                let table = await db.collection(user._id)
                res.json({
                    code: 200,
                    data: await table.find({_id: repo_name}).limit(1).next()
                });
            }
            return
        }
    } catch (e) {
        console.error(new Date(), e.message)
    }

    res.json({
        code: 0,
        data: {
            _id: repo_name, tags: []
        }
    });
})

app.get('/api/get-list', async function (req, res) {
    let repo_list = req.query.repo_list
    try {
        let token = req.query.token

        console.log(new Date(), "get-list", repo_list)

        if (token && repo_list) {
            let user = await db.collection("user").find({uuid: token}).limit(1).next()
            if (user) {
                let array = []
                let table = await db.collection(user._id)
                for (let i = 0; i < repo_list.length; i++) {
                    let item = await table.find({_id: repo_list[i]}).limit(1).next()
                    array.push(item ? item : {
                        _id: repo_list[i],
                        tags: []
                    })
                }
                res.json({
                    code: 200,
                    data: array
                });
            }
            return
        }
    } catch (e) {
        console.error(new Date(), e.message)
    }

    let array = []
    for (let i = 0; i < repo_list.length; i++) {
        array.push({
            _id: repo_list[i],
            tags: []
        })
    }
    res.json({
        code: 0,
        data: array
    });
})


app.get('/api/search', async function (req, res) {
    try {
        let token = req.query.token
        let keyword = req.query.keyword

        console.log(new Date(), "search", keyword)
        if (token && keyword) {
            let user = await findUserByToken(token);
            if (user) {
                let table = await db.collection(user._id)
                let array = await table.find({tags: new RegExp(keyword, 'g')}).sort({created: -1}).toArray()
                res.json({
                    code: 200,
                    data: array,
                    message: "搜索到" + array.length + "个标签"
                });
            }
            return
        }
    } catch (e) {
        console.error(e.message)
    }

    res.json({
        code: 200,
        data: []
    });
})


app.get('/api/get-all', async function (req, res) {
    try {
        let token = req.query.token
        if (token) {
            let user = await findUserByToken(token);
            if (user) {
                let table = await db.collection(user._id)
                let array = await table.find().sort({created: -1}).toArray()
                res.json({
                    code: 200,
                    data: array,
                    message: "共" + array.length + "个标签"
                });
            }
            return
        }
    } catch (e) {
        console.error(new Date(), e.message)
    }

    res.json({
        code: 200,
        data: []
    });
})

app.get('/api/oauth', async function (req, res) {
    const url = "https://github.com/login/oauth/authorize?client_id=" + config.client_id
    res.redirect(302, url)
})

app.get('/api/oauth-callback', async function (req, res) {
    try {
        const params = {
            code: req.query.code,
            client_id: config.client_id,
            client_secret: config.client_secret
        }
        let rsp = await request.post({url: "https://github.com/login/oauth/access_token", form: params, json: true});
        console.debug(new Date(), rsp)
        const headers = {
            "Authorization": "token " + rsp.access_token,
            "User-Agent": config.app_name
        }
        let githubUser = await request.get({url: 'https://api.github.com/user', headers: headers, json: true});
        console.debug(new Date(), githubUser)

        let username = githubUser.login
        let table = await db.collection("user")
        let user = await table.find({_id: username}).limit(1).next()
        if (user) {
            //如果已存在
            res.json({
                code: 200,
                data: user.uuid,
                message: "老用户"
            });
        } else {
            //新用户
            let newUser = {
                avatar: githubUser.avatar_url,
                nickname: githubUser.name,
                _id: username,
                uuid: uuidv1().replace("-", "")
            }
            await table.insertOne(newUser)
            console.debug(new Date(), "新增用户", newUser)
            res.json({
                code: 200,
                data: newUser.uuid,
                message: "新用户"
            });
        }
    } catch (e) {
        sendError(res, e)
    }
})

app.get('/api/login', async function (req, res) {
    try {
        let token = req.headers["x-user-token"]
        if (token) {
            let table = await db.collection("user")
            let user = await table.find({uuid: token}).limit(1).next()
            if (user) {
                //如果已存在
                res.json({
                    code: 200,
                    data: {
                        nickname: user.nickname,
                        avatar: user.avatar,
                        token: user.uuid
                    }
                });
                return
            }
        }
        throw {message: "此Token无效"}
    } catch (e) {
        sendError(res, e)
    }
})

async function findUserByToken(token) {
    return await db.collection("user").find({uuid: token}).limit(1).next()
}

function sendError(res, e, msg) {
    console.error(new Date(), e.message)

    res.json({
        code: 0,
        data: null,
        message: msg ? msg : e.message
    });
}

const port = parseInt(process.env.PORT || 9000)
var server = app.listen(port, function () {

    var host = server.address().address
    if (host === '::') {
        host = "localhost"
    }

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})
