"use strict";
// 标记当前元素已经被创建并绑定
var bindMark = '__bind_remark';
var defalutUserName = 'default_user';
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
var _create_project_remark_dom = function (el, project_name) {
    // 如果 dom 已经被创建则直接返回 true
    if (el.getAttribute != null &&
        el.getAttribute('class') != null &&
        el.getAttribute('class').indexOf(bindMark) !== -1)
        return true;

    // 调整元素位置，以供 input 填充
    el.style.marginBottom = '30px';
    el.style.display = 'block';

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
                _get_project_tags(project_name, _get_github_username(), function (tags) {
                    that.tags = tags;
                    that.edit = JSON.stringify(tags) == '[]';
                });
            },
            render: function (h) {
                var that = this;
                return h('tag-group', {
                    'class': {
                        'git_remarks_plugin__input': true
                    },
                    attrs: {
                        tags: that.tags,
                        edit: that.edit,
                    },
                    on: {
                        change: function (event) {
                            _save_project_remarks(project_name, _get_github_username(), event)
                        }
                    },
                    key: project_name
                })
            }
        })
    ;
    var input = vue.$mount();
    el.parentNode.insertBefore(input.$el, el);

    // 有 fork 时 input 应该更往下
    //console.log(el.getElementsByClassName('fork-flag'), input);
    if (el.getElementsByClassName('fork-flag').length > 0) {
        input.$el.style.marginTop = '40px';
    } else if (document.getElementById('choose-pinned-repositories') !== null) {
        //在个人列表20px
        input.$el.style.marginTop = '20px';
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
var _create_search_dom = function (el, project_name) {
    // 如果 dom 已经被创建则直接返回 true
    if (el.getAttribute != null &&
        el.getAttribute('class') != null &&
        el.getAttribute('class').indexOf(bindMark) !== -1)
        return true;

    // 打上标记，防止重复绑定
    el.setAttribute('class', el.getAttribute('class') + ' ' + bindMark);

    var vue = new Vue({
            el: el,
            mounted: function () {
                el.setAttribute('v-bind:click', "handlerChangeValue");
            },
            handlerChangeValue(){
                console.log("---->")
            }
        })
    ;
    return false;
};

/**
 * 绑定组件到相关元素中
 * @private
 */
var _bind_project_remarks = function () {
    var project, projects, project_name, i;

    //项目列表搜索框
    var search = document.getElementsByClassName('TableObject')
    if (search !== null) {
        _create_search_dom(document.getElementsByClassName('position-relative')[5], "")
    }

    // 项目页
    if (document.getElementsByClassName('repohead-details-container').length === 1 &&
        document.getElementsByClassName('repohead-details-container')[0].getElementsByTagName('h1').length === 1) {
        project = document.getElementsByClassName('repohead-details-container')[0].getElementsByTagName('h1')[0];
        projects = project.getElementsByTagName('a');
        for (i = 0; i < projects.length; i++) {
            if (projects[i].getAttribute('data-pjax') !== null) {
                project_name = project.getElementsByTagName('a')[i].getAttribute('href');
                break;
            }
        }

        _create_project_remark_dom(project, project_name);
    }


    // 个人中心列表页
    if (document.getElementById('js-pjax-container') !== null) {
        var list = document.getElementById('js-pjax-container');
        projects = list.getElementsByTagName('h3');
        for (i = 0; i < projects.length; i++) {
            if (projects[i].getElementsByTagName('a').length === 1) {
                project_name = projects[i].getElementsByTagName('a')[0].getAttribute('href');

                if (project_name !== null)
                    _create_project_remark_dom(projects[i], project_name);
            }
        }
    }

    // repositories 元素
    if (document.getElementsByClassName('pinned-repos-list').length === 1 &&
        document.getElementsByClassName('pinned-repo-item').length > 0) {
        projects = document.getElementsByClassName('pinned-repo-item');
        for (i = 0; i < projects.length; i++) {
            var a = projects[i].getElementsByTagName('a');
            for (var ii = 0; ii < a.length; ii++) {
                if (a[ii].getElementsByClassName('text-bold') != null && a[ii].getElementsByTagName('span').length === 1) {
                    project_name = a[ii].getAttribute('href');
                    _create_project_remark_dom(a[ii], project_name);
                    break;
                }
            }
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
    chrome.storage.sync.get('items', function (rsp) {
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
};

var _get_project_tags = function (project_name, username, callback) {
    _get_project_remarks(project_name, username, function (rsp) {
        for (var i = 0; i < rsp.items.length; i++) {
            if (rsp.items[i].project_name == project_name) {
                callback(rsp.items[i].tags)
                break
            }
        }
    })
}


var _search_project_by_tag = function (tag_name, callback) {
    _get_project_remarks("", _get_github_username(), function (rsp) {
        var array = new Array()
        for (var i = 0; i < rsp.items.length; i++) {
            for (var j = 0; j < rsp.items[i].tags.length; j++) {
                if (rsp.items[i].tags[j] == tag_name) {
                    array.push(rsp.items[i])
                    break
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
        if (project_name == null) {
            return
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
        console.log("保存成功\n" + JSON.stringify(rsp, null, 2))
        chrome.storage.sync.set(rsp);
    });
};

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
