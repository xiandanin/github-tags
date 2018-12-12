"use strict";
// 标记当前元素已经被创建并绑定
var bindMark = '__bind_remark';
var defalutUserName = 'default_user';

var initBmob = false

function callBmob(callback) {
    //初始化Bmob
    if (initBmob) {
        callback()
    } else {
        chrome.storage.sync.get(null, function (rsp) {
            Bmob.initialize(rsp.appid, rsp.apikey);
            initBmob = true
            callback()
        });
    }
}

/**
 * 获取 github 用户名
 * @returns {string}
 * @private
 */
var _get_github_username = function () {
    var metas = document.getElementsByTagName('meta');
    var username = defalutUserName;
    for (var i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('name') === 'user-login' && metas[i].getAttribute('content') != '') {
            username = metas[i].getAttribute('content');
            break;
        }
    }

    return username;
};

/**
 * 创建组件
 * @param el 需要被绑定的元素
 * @param project_name 项目名称
 * @returns
 * @private
 */
var _create_project_remark_dom = function (el, project_name, class_name, insert_before) {
    if (project_name != undefined && project_name.indexOf("/") == 0) {
        project_name = project_name.substring(1, project_name.length)
    }
    // 如果 dom 已经被创建则直接返回 true
    if (el.getAttribute != null &&
        el.getAttribute('class') != null &&
        el.getAttribute('class').indexOf(bindMark) !== -1)
        return true;

    // 调整元素位置，以供 input 填充
    //el.style.marginBottom = '30px';
    //el.style.display = 'block';

    // 打上标记，防止重复绑定
    el.setAttribute('class', el.getAttribute('class') + ' ' + bindMark);
    var vue = new Vue({
            data: {
                name: project_name,
                tags: [],
                edit: true
            },
            created: function () {
                var that = this;
                get_tags_by_project_name(project_name, function (tags) {
                    that.tags = tags;
                    that.edit = JSON.stringify(tags) == '[]';
                })
            },
            render: function (h) {
                var that = this;
                return h('tag-group', {
                    attrs: {
                        tags: that.tags,
                        edit: that.edit,
                        name: project_name,
                        class: class_name
                    },
                    on: {
                        change: function (event) {
                            save_project_tags(project_name, event)
                            _save_project_remarks(project_name, _get_github_username(), event)
                        },
                        changeEdit: function (edit) {
                            that.edit = edit
                        }
                    },
                    key: project_name
                })
            }
        })
    ;
    var input = vue.$mount();
    if (insert_before) {
        el.parentNode.insertBefore(input.$el, el);
    } else {
        insertAfter(input.$el, el)
    }

    // 有 fork 时 input 应该更往下
    //console.log(el.getElementsByClassName('fork-flag'), input);
    if (el.getElementsByClassName('fork-flag').length > 0) {
        input.$el.style.marginTop = '40px';
    }

    return input;
};

/**
 * 搜索框
 * @param el
 * @param project_name
 * @returns {boolean}
 * @private
 */
var _create_search_dom = function (el) {
    // 如果 dom 已经被创建则直接返回 true
    if (el.getAttribute != null &&
        el.getAttribute('class') != null &&
        el.getAttribute('class').indexOf(bindMark) !== -1)
        return true;

    // 打上标记，防止重复绑定
    el.setAttribute('class', el.getAttribute('class') + ' ' + bindMark);

    var vue = new Vue({
            data: {},
            render: function (h) {
                var that = this;
                return h('a', {
                    attrs: {
                        class: "btn",
                        href: "#",
                        style: "margin-right:8px;margin-left:8px;float: left;"
                    },
                    domProps: {
                        innerHTML: "按标签搜索"
                    },
                    on: {
                        click: function (event) {
                            _create_search_list_dom(document.getElementById("search_input").value)
                        },
                    }
                })
            }
        })
    ;
    var div = document.createElement("div")

    var input = document.createElement("input")
    input.id = "search_input"
    input.style = "width:400px;float: left;"
    input.type = "search"
    input.name = "q"
    input.className = "form-control"
    input.autocapitalize = "off"
    input.autocomplete = "off"
    input.value = getUrlParams("q")

    var button = document.createElement("button")
    var search_function = function () {
        var url = window.location.href
        if (url.indexOf("&q") != -1) {
            window.location.href = url.substring(0, url.indexOf("&q")) + "&q=" + input.value
        } else {
            window.location.href = url + "&utf8=✓&q=" + input.value
        }
    }
    button.onclick = search_function
    button.className = "btn"
    button.innerHTML = "<svg class=\"octicon octicon-search\" style=\"margin-right: 10px;vertical-align:middle\" viewBox=\"0 0 16 16\" version=\"1.1\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill-rule=\"evenodd\" d=\"M15.7 13.3l-3.81-3.83A5.93 5.93 0 0 0 13 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 0 0 0-1.41v.01zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z\"></path></svg>搜索"

    input.addEventListener("keypress", function () {
        if (event.keyCode == 13) {
            search_function()
        }
    })

    div.appendChild(input)
    div.appendChild(vue.$mount().$el)
    div.appendChild(button)
    el.parentNode.insertBefore(div, el)
    return false;
};


/**
 * 搜索后的列表
 * @param el
 * @param project_name
 * @returns {boolean}
 * @private
 */
var _create_search_list_dom = function (keyword) {
    var el = document.getElementsByClassName("col-lg-12")[0]

    var vue = new Vue({
        data: {
            items: []
        },
        created: function () {
            var that = this;
            search_project_by_tags(keyword.split(","), function (rsp) {
                console.log("搜索结果：\n" + JSON.stringify(rsp, null, 2))
                that.items = rsp
            })
        },
        render: function (h) {
            var that = this;
            return h('list', {
                attrs: {
                    items: that.items
                },
            })
        }
    })

    //计算出已存在item数量
    var childNodes = el.childNodes
    var itemCount = 0
    for (var i = 0; i < childNodes.length; i++) {
        if (childNodes[i].className != undefined && childNodes[i].className.indexOf("col-12") != -1) {
            itemCount++
        }
    }
    //先清空现有的item
    for (var i = 0; i < itemCount; i++) {
        el.removeChild(el.getElementsByClassName("col-12")[0])
    }

    var result_container = document.getElementsByClassName("search-result-container")
    //如果之前已经有搜索结果 先删除掉之前的
    if (result_container != null && result_container.length > 0) {
        el.removeChild(result_container[0])
    }
    var paginate = document.getElementsByClassName("paginate-container")[0]
    el.insertBefore(vue.$mount().$el, paginate)

    return false;
};


/**
 * 绑定组件到相关元素中
 * @private
 */
var _bind_project_remarks = function () {
    var project, projects, project_name, i;

    var repositories = document.getElementsByClassName('text-uppercase')
    if (repositories !== null && repositories.length > 0) {
        var details = repositories[0].parentNode.getElementsByTagName("details")
        _create_search_dom(details[0])
        repositories[0].parentNode.removeChild(repositories[0])
    }

    // 项目详情页
    if (document.getElementsByClassName('repohead-details-container').length === 1 &&
        document.getElementsByClassName('repohead-details-container')[0].getElementsByTagName('h1').length === 1) {
        project = document.getElementsByClassName('repohead-details-container')[0].getElementsByTagName('h1')[0];
        projects = project.getElementsByTagName('a');
        for (i = 0; i < projects.length; i++) {
            if (projects[i].getAttribute('data-pjax') !== null) {
                var fork = project.getElementsByClassName("fork-flag")
                //如果是fork的 拿fork的名字
                if (fork != null && fork.length > 0) {
                    project_name = fork[0].getElementsByTagName("a")[0].getAttribute('href');
                } else {
                    //如果fork没有拿到直接取项目名
                    project_name = project.getElementsByTagName('a')[i].getAttribute('href');
                }
                break;
            }
        }

        _create_project_remark_dom(project, project_name, "git_remarks_plugin__input", false);
    }


    // 列表
    if (document.getElementById('js-pjax-container') !== null) {
        var list = document.getElementById('js-pjax-container');
        projects = list.getElementsByTagName('h3');
        for (i = 0; i < projects.length; i++) {
            //如果有fork的 取fork的名称
            var forkSpan = projects[i].parentNode.getElementsByClassName("f6 text-gray mb-1")
            if (forkSpan != null && forkSpan.length > 0) {
                var forkA = forkSpan[0].getElementsByTagName("a")
                if (forkA != null && forkA.length > 0) {
                    project_name = forkA[0].getAttribute('href');
                }
            } else {
                //如果没有fork才取项目名
                if (projects[i].getElementsByTagName('a').length === 1) {
                    project_name = projects[i].getElementsByTagName('a')[0].getAttribute('href');
                }
            }
            if (project_name !== null && project_name != undefined && project_name != "") {
                _create_project_remark_dom(projects[i], project_name, "repository_detail_tags_container", false);
            }
        }
    }

    // 个人主页
    if (document.getElementsByClassName('pinned-repos-list').length === 1 &&
        document.getElementsByClassName('pinned-repo-item').length > 0) {
        projects = document.getElementsByClassName('pinned-repo-item');
        for (i = 0; i < projects.length; i++) {
            var createClass = "stars_list_container";
            var p = projects[i].getElementsByClassName('pinned-repo-desc');
            //先检查fork的
            var forkTag = projects[i].getElementsByClassName("text-gray text-small mb-2")
            if (forkTag != null && forkTag.length > 0) {
                var forkA = forkTag[0].getElementsByTagName("a")
                if (forkA != null && forkA.length > 0) {
                    project_name = forkA[0].getAttribute('href');
                    createClass = "stars_list_fork";
                }
            } else {
                project_name = projects[i].getElementsByTagName("a")[0].getAttribute('href');
            }

            _create_project_remark_dom(p[0], project_name, createClass, true);
        }
    }
};


/**
 * 读取配置项
 * @param project_name 项目名称
 * @param username 用户名
 * @param callback 回调
 * @private
 */
var _get_project_remarks = function (project_name, username, callback) {
    chrome.storage.local.get('items', function (rsp) {
        if (JSON.stringify(rsp) != '{}') {
            //有数据说明迁移过了 直接取本地
            _get_project_remarks_v2(project_name, username, callback)
        } else {
            //没有数据说明未迁移 从同步迁移到本地
            chrome.storage.sync.get('items', function (rsp) {
                chrome.storage.local.set(rsp);
                chrome.storage.sync.set({'items': null}, function () {

                });

                _get_project_remarks_v2(project_name, username, callback)
            });
        }

    });
};

var _get_project_remarks_v2 = function (project_name, username, callback) {
    chrome.storage.local.get('items', function (rsp) {
        if (JSON.stringify(rsp) == '{}') {
            var result = {}
            result.project_name = project_name
            result.tags = []
            var items = [];
            items.push(result)

            rsp.items = items
        }
        callback(rsp);
    });
}

var _get_project_tags = function (project_name, username, callback) {
    _get_project_remarks(project_name, username, function (rsp) {
        for (var i = 0; i < rsp.items.length; i++) {
            if (rsp.items[i].project_name == project_name) {
                if (rsp.items[i].tags.length > 0) {
                    callback(rsp.items[i].tags)
                    break
                }
            }
        }
    })
}


var _search_project_by_tag = function (tag_name, callback) {
    _get_project_remarks("", _get_github_username(), function (rsp) {
        var array = new Array()
        for (var i = 0; i < rsp.items.length; i++) {
            for (var j = 0; j < rsp.items[i].tags.length; j++) {
                var item_tag = rsp.items[i].tags[j]
                if (item_tag != null && item_tag != undefined && item_tag != "") {
                    if (item_tag.toLowerCase().indexOf(tag_name.toLowerCase()) != -1) {
                        array.push(rsp.items[i])
                        break
                    }
                }
            }
        }

        callback(array)
    })
}

/**
 * 保存用户设置
 * @param project_name
 * @param username
 * @param value
 * @private
 */
var _save_project_remarks = function (project_name, username, value) {
    _get_project_remarks(null, null, function (rsp) {
        if (project_name == null || project_name == '') {
            return
        }
        if (project_name.indexOf("/") == 0) {
            project_name = project_name.substring(1, project_name.length)
        }

        if (rsp.items == undefined) {
            rsp.items = []
        }

        var add = false
        for (var i = 0; i < rsp.items.length; i++) {
            if (rsp.items[i].project_name == project_name) {
                rsp.items[i].tags = value
                add = true
                break
            }
        }
        if (add == false) {
            var result = {}
            result.project_name = project_name
            result.tags = value
            rsp.items.push(result)
        }
        //console.log("保存成功\n" + JSON.stringify(rsp, null, 2))
        chrome.storage.local.set(rsp);
    });
};

/**
 * 根据项目名称获取标签列表
 * @param project_name
 */
function get_tags_by_project_name(project_name, callback) {
    if (project_name == null || project_name == undefined || project_name == "") {
        return
    }
    callBmob(function () {
        //先查出这个项目的id
        const query = Bmob.Query("project_tags");
        query.equalTo("project_name", '==', project_name);
        query.select("tag_name_array");
        query.limit(1)
        query.find().then(res => {
            if (res != null && res.length > 0) {
                callback(JSON.parse(res[0].tag_name_array))
            }
        }).catch(err => {
            console.log(err)
        });
    })
}

/**
 * 保存项目标签
 * @param project_name
 * @param value
 */
function save_project_tags(project_name, value) {
    callBmob(function () {
        //先根据name查找项目
        const query = Bmob.Query('project_tags');
        query.equalTo("project_name", '==', project_name);
        query.find().then(results => {
            const query = Bmob.Query('project_tags');
            query.set('tag_name_array', JSON.stringify(value))
            if (results.length <= 0) {
                //新增
                query.set("project_name", project_name)
            } else {
                //修改
                query.set("id", results[0].objectId)
            }
            query.save().then(obj => {
                console.log(JSON.stringify(obj))
            }).catch(err => {
                console.log(err)
            })
        }).catch(err => {
            console.log(err)
        })
    })
}


/**
 * 根据标签找项目
 */
function get_all_project_data(callback) {
    callBmob(function () {
        //每页数量
        var pageSize = 1000
        const countQuery = Bmob.Query('project_tags');
        countQuery.count().then(count => {
            var allData = new Array()
            //一共几页
            var pageCount = Math.ceil(count / pageSize)
            for (let page = 0; page < pageCount; page++) {
                const query = Bmob.Query("project_tags");
                query.skip(page * pageSize);
                query.order("-createdAt");
                query.limit(pageSize);
                query.find().then(res => {
                    allData.push.apply(allData, res);
                    if (page == pageCount - 1) {
                        //最后一页 请求完就直接返回
                        callback(allData)
                    }
                });
            }
        });
    })
}

/**
 * 根据标签找项目列表
 * @param tag_array
 * @param callback
 */
function search_project_by_tags(keyword_array, callback) {
    get_all_project_data(function (all) {
        var array = new Array()
        for (let i = 0; i < all.length; i++) {
            var item = all[i]
            var tag_array_json = item.tag_name_array
            if (tag_array_json != null && tag_array_json.length > 0) {
                var tag_array = JSON.parse(tag_array_json)
                for (let j = 0; j < tag_array.length; j++) {
                    if (tag_array[j] != null && tag_array[j] != undefined && tag_array[j] != "") {
                        for (let k = 0; k < keyword_array.length; k++) {
                            //if (tag_array[j].toLowerCase().indexOf(keyword_array[k].toLowerCase()) != -1) {
                            if (tag_array[j].toLowerCase() == keyword_array[k].toLowerCase()) {
                                item.tags = tag_array
                                array.push(item)
                                break
                            }
                        }
                    }
                }
            }
        }
        callback(array)
    })
}

/**
 * 监听 dom 的刷新以重新绑定相关组件
 * @param dom 需要监听的 dom
 * @private
 */
var _watch_dom_flash = function (dom) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var observer = new MutationObserver(function (mutations) {
        _bind_project_remarks()
    });
    observer.observe(dom, {
        childList: true,
        subtree: true,
        characterData: true
    });
};

/**
 * 窗口载入完毕执行
 */
document.addEventListener("DOMContentLoaded", function () {
    // 绑定组件
    _bind_project_remarks();
    // 监听 github dom 刷新
    if (document.getElementById('js-pjax-container') != null) {
        _watch_dom_flash(document.getElementById('js-pjax-container'));
    } else if (document.getElementById('js-repo-pjax-container') != null) {
        _watch_dom_flash(document.getElementById('js-repo-pjax-container'));
    }
}, false);

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function getUrlParams(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = encodeURI(window.location.search).substr(1).match(reg);
    if (r != null)
        return decodeURI(unescape(r[2]));
    return null;
}