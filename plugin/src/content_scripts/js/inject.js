'use strict';
// 标记当前元素已经被创建并绑定
var bindMarkText = '__bind_mark';
var defalutUserName = 'default_user';

/**
 * 获取 github 用户名
 * @returns {string}
 * @private
 */
var _get_github_username = function() {
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

var isBindMark = function(el) {
  // 如果 dom 已经被创建则直接返回 true
  if (el.getAttribute != null && el.getAttribute('class') != null && el.getAttribute('class').indexOf(bindMarkText) !== -1) {
    return true;
  } else {
    return false;
  }
};

var bindMark = function(el) {
  // 打上标记，防止重复绑定
  el.setAttribute('class', el.getAttribute('class') + ' ' + bindMarkText);
};

/**
 * 创建组件
 * @param el 需要被绑定的元素
 * @param item
 * @returns
 * @private
 */
var _create_project_remark_dom = function(el, item, class_name, insertElement) {
  // 调整元素位置，以供 input 填充
  // el.style.marginBottom = '30px';
  // el.style.display = 'block';

  if (!item.tags) {
    item.tags = [];
  }

  var vue = new Vue({
    data: {
      name: item._id,
      tags: item.tags,
      edit: item.tags.length === 0,
    },
    created: function() {},
    render: function(h) {
      var that = this;
      return h('tag-group', {
        attrs: {
          tags: that.tags,
          edit: that.edit,
          name: that.name,
          class: class_name,
        },
        on: {
          change: function(event) {
            saveTagsByRepo(item._id, event);
          },
          changeEdit: function(edit) {
            that.edit = edit;
          },
        },
        key: item._id,
      });
    },
  });

  var input = vue.$mount();
  insertElement(input.$el);

  // 有 fork 时 input 应该更往下
  // console.log(el.getElementsByClassName('fork-flag'), input);
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
var _create_search_dom = function() {
  const el = document.querySelector('form.subnav-search').parentNode;
  // 如果 dom 已经被创建则直接返回 true
  if (el.getAttribute != null && el.getAttribute('class') != null && el.getAttribute('class').indexOf(bindMarkText) !== -1) return true;

  // 打上标记，防止重复绑定
  el.setAttribute('class', el.getAttribute('class') + ' ' + bindMarkText);

  var vue = new Vue({
    data: {},
    render: function(h) {
      var that = this;
      return h('button', {
        attrs: {
          id: 'search_by_tag',
          class: 'btn',
          style: 'margin-right:8px;margin-left:8px;',
        },
        domProps: {
          innerHTML: '按标签搜索',
        },
        on: {
          click: function(event) {
            _create_search_list_dom(document.getElementById('search_input').value);
          },
        },
      });
    },
  });

  var div = document.createElement('div');
  div.style = 'margin-top:16px;'

  var input = document.createElement('input');
  input.id = 'search_input';
  input.type = 'search';
  input.name = 'q';
  input.className = 'form-control subnav-search-input';
  input.autocapitalize = 'off';
  input.autocomplete = 'off';
  input.value = getUrlParams('q');

  var button = new Vue({
    data: {},
    render: function(h) {
      var that = this;
      return h('button', {
        attrs: {
          class: 'btn',
          href: 'button',
          style: 'margin-right:8px;',
        },
        domProps: {
          innerHTML:
            '<svg class="octicon octicon-search" style="margin-right: 10px;vertical-align:middle" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M15.7 13.3l-3.81-3.83A5.93 5.93 0 0 0 13 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 0 0 0-1.41v.01zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z"></path></svg>搜索',
        },
        on: {
          click: function(event) {
            var url = window.location.href;
            if (url.indexOf('&q') != -1) {
              window.location.href = url.substring(0, url.indexOf('&q')) + '&q=' + input.value;
            } else {
              window.location.href = url + '&utf8=✓&q=' + input.value;
            }
          },
        },
      });
    },
  });

  /*input.addEventListener('keypress', function() {
    if (event.keyCode == 13) {
      search_function();
    }
  });*/

  var vue_all = new Vue({
    data: {},
    render: function(h) {
      var that = this;
      return h('button', {
        attrs: {
          class: 'btn',
          href: 'button',
          style: 'margin-right:8px;',
        },
        domProps: {
          innerHTML: '查看所有标签',
        },
        on: {
          click: function(event) {
            show_all_tags(div);
          },
        },
      });
    },
  });

  div.appendChild(input);
  div.appendChild(vue.$mount().$el);
  div.appendChild(vue_all.$mount().$el);
  // div.appendChild(button.$mount().$el);
  // el.parentNode.insertBefore(div, el);
  el.parentNode.insertBefore(div, el);

  return false;
};

/**
 * 搜索后的列表
 * @param el
 * @param project_name
 * @returns {boolean}
 * @private
 */
var _create_search_list_dom = function(keyword) {
  var el = document.getElementsByClassName('col-lg-12')[0];

  var vue = new Vue({
    data: {
      items: [],
    },
    created: function() {
      var that = this;
      searchTags(keyword, function(rsp) {
        console.log('搜索结果：\n' + JSON.stringify(rsp, null, 2));
        that.items = rsp.map(it => {
          if (it.project_name.indexOf('/') === 0) {
            it.project_name = it.project_name.substring(1);
          }
          return it;
        });
      });
    },
    render: function(h) {
      var that = this;
      return h('list', {
        attrs: {
          items: that.items,
        },
      });
    },
  });

  // 计算出已存在item数量
  var childNodes = el.childNodes;
  var itemCount = 0;
  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].className != undefined && childNodes[i].className.indexOf('col-12') != -1) {
      itemCount++;
    }
  }
  // 先清空现有的item
  for (var i = 0; i < itemCount; i++) {
    el.removeChild(el.getElementsByClassName('col-12')[0]);
  }

  var result_container = document.getElementsByClassName('search-result-container');
  // 如果之前已经有搜索结果 先删除掉之前的
  if (result_container != null && result_container.length > 0) {
    el.removeChild(result_container[0]);
  }
  var paginate = document.querySelector('.search-result-container');
  el.insertBefore(vue.$mount().$el, paginate);

  return false;
};

var get_all_tags = function(callback) {
  getAllTags(function(all) {
    var array = new Array();
    // 遍历A-Z
    for (let k = 'a'.charCodeAt(); k <= 'z'.charCodeAt(); k++) {
      var letterUpper = String.fromCharCode(k).toUpperCase();
      // 遍历所有标签
      var letterArray = new Array();
      for (let i = 0; i < all.length; i++) {
        for (let j = 0; j < all[i].tags.length; j++) {
          var tag = all[i].tags[j];
          var letter = pinyinUtil.getFirstLetter(tag.charAt(0));
          // 如果字母相同
          if (letterUpper == letter.toUpperCase()) {
            if (letterArray.indexOf(tag) == -1) {
              letterArray.push(tag);
            }
          }
        }
      }
      if (letterArray.length > 0) {
        letterArray.sort(function compareFunction(param1, param2) {
          return param2.localeCompare(param1, 'zh');
        });
        var item = {};
        item.letter = letterUpper;
        item.tags = letterArray;
        array.push(item);
      }
    }
    callback(array);
  });
};

function show_all_tags(container) {
  var vue = new Vue({
    data: {
      tags: [],
      loading: true,
    },
    created: function() {
      var that = this;
      get_all_tags(function(all_tags) {
        console.log(JSON.stringify(all_tags));
        if (all_tags.length <= 0) {
          return;
        }
        that.loading = false;
        that.tags = all_tags;
      });
    },
    render: function(h) {
      var that = this;
      return h('all-tag', {
        attrs: {
          tags: that.tags,
          dialogVisible: true,
          loading: that.loading,
        },
      });
    },
  });
  container.appendChild(vue.$mount().$el);
}

/**
 * 绑定组件到相关元素中
 * @private
 */
var _bind_project_remarks = function() {
  var project, projects, project_name, i;


  if (window.location.href.indexOf('tab=stars')!==-1) {
    _create_search_dom()
  }

  // 项目详情页
  const detail = document.querySelector('#js-repo-pjax-container > div > div');

  if (detail && detail.getElementsByTagName('h1').length > 0) {
    project = detail.getElementsByTagName('h1')[0];

    if (isBindMark(project)) {
      return;
    } else {
      bindMark(project);
    }

    projects = project.getElementsByTagName('a');
    for (i = 0; i < projects.length; i++) {
      if (projects[i].getAttribute('data-pjax') !== null) {
        var fork = project.getElementsByClassName('fork-flag');
        // 如果是fork的 拿fork的名字
        if (fork != null && fork.length > 0) {
          project_name = fork[0].getElementsByTagName('a')[0].getAttribute('href');
        } else {
          // 如果fork没有拿到直接取项目名
          project_name = project.getElementsByTagName('a')[i].getAttribute('href');
        }
        break;
      }
    }

    requestTagsByRepo(project_name, function(rsp) {
      const node = project.parentNode.parentNode;
      _create_project_remark_dom(node, rsp || { _id: project_name }, 'git_remarks_plugin__input git_remarks_plugin__detail px-3 px-lg-5', el => {
        insertAfter(el, node);
      });
    });
    return;
  }
  // 列表
  let repoList = document.querySelector('.repo-list');
  if (repoList) {
    if (isBindMark(repoList)) {
      return;
    } else {
      bindMark(repoList);
    }
    var project_name_array = [];
    let repoNameList = repoList.getElementsByClassName('f4 text-normal');
    for (i = 0; i < repoNameList.length; i++) {
      if (repoNameList[i].getElementsByTagName('a').length === 1) {
        project_name = repoNameList[i].getElementsByTagName('a')[0].getAttribute('href');
      }
      if (project_name !== null && project_name != undefined && project_name != '') {
        project_name_array.push(project_name);
      }
    }
    requestTagsByRepoList(project_name_array, function(rsp) {
      for (let j = 0; j < rsp.length; j++) {
        _create_project_remark_dom(repoNameList[j], rsp[j] ? rsp[j] : { _id: project_name }, 'repository_detail_tags_container', el => {
          insertAfter(el, repoNameList[j].parentNode);
        });
      }
    });
    return;
  }

  // star列表
  let star = document.getElementsByClassName('d-lg-flex gutter-lg');
  if (star && star.length > 0) {
    var list = star[0];

    if (isBindMark(star[0])) {
      return;
    } else {
      bindMark(star[0]);
    }

    projects = list.getElementsByTagName('h3');
    var project_name_array = [];
    for (i = 0; i < projects.length; i++) {
      // 如果有fork的 取fork的名称
      var forkSpan = projects[i].parentNode.getElementsByClassName('f6 text-gray mb-1');
      if (forkSpan != null && forkSpan.length > 0) {
        var forkA = forkSpan[0].getElementsByTagName('a');
        if (forkA != null && forkA.length > 0) {
          project_name = forkA[0].getAttribute('href');
        }
      } else {
        // 如果没有fork才取项目名
        if (projects[i].getElementsByTagName('a').length === 1) {
          project_name = projects[i].getElementsByTagName('a')[0].getAttribute('href');
        }
      }
      if (project_name !== null && project_name != undefined && project_name != '') {
        project_name_array.push(project_name);
      }
    }

    requestTagsByRepoList(project_name_array, function(rsp) {
      for (let j = 0; j < rsp.length; j++) {
        _create_project_remark_dom(projects[j], rsp[j] ? rsp[j] : { _id: project_name }, 'repository_detail_tags_container', el => {
          insertAfter(el, projects[j]);
        });
      }
    });
    return;
  }

  // 个人主页
  let mainPage = document.getElementsByClassName('js-pinned-items-reorder-container');
  if (mainPage && mainPage.length > 0) {
    if (isBindMark(mainPage[0])) {
      return;
    } else {
      bindMark(mainPage[0]);
    }
    projects = document.getElementsByClassName('pinned-item-list-item-content');
    var project_name_array = [];
    for (i = 0; i < projects.length; i++) {
      var createClass = 'stars_list_container';
      // 先检查fork的
      var forkTag = projects[i].getElementsByClassName('text-gray text-small mb-2');
      if (forkTag != null && forkTag.length > 0) {
        var forkA = forkTag[0].getElementsByTagName('a');
        if (forkA != null && forkA.length > 0) {
          project_name = forkA[0].getAttribute('href');
          createClass = 'stars_list_fork';
        }
      } else {
        project_name = projects[i].getElementsByTagName('a')[0].getAttribute('href');
      }
      project_name_array.push(project_name);
    }

    requestTagsByRepoList(project_name_array, function(rsp) {
      for (let j = 0; j < rsp.length; j++) {
        var p = projects[j].getElementsByClassName('pinned-item-desc')[0];
        _create_project_remark_dom(p, rsp[j] ? rsp[j] : { _id: project_name }, createClass, el => {
          p.parentNode.insertBefore(el, p);
        });
      }
    });
  }
};

/**
 * 监听 dom 的刷新以重新绑定相关组件
 * @param dom 需要监听的 dom
 * @private
 */
var _watch_dom_flash = function(dom) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  var observer = new MutationObserver(function(mutations) {
    _bind_project_remarks();
  });
  observer.observe(dom, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

/**
 * 窗口载入完毕执行
 */
document.addEventListener(
  'DOMContentLoaded',
  function() {
    // 绑定组件
    _bind_project_remarks();
    // 监听 github dom 刷新
    if (document.getElementById('js-pjax-container') != null) {
      _watch_dom_flash(document.getElementById('js-pjax-container'));
    } else if (document.getElementById('js-repo-pjax-container') != null) {
      _watch_dom_flash(document.getElementById('js-repo-pjax-container'));
    }
  },
  false
);

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function getUrlParams(name) {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  var r = encodeURI(window.location.search)
    .substr(1)
    .match(reg);
  if (r != null) return decodeURI(unescape(r[2]));
  return null;
}

axios.defaults.baseURL = 'http://localhost:9000/';
chrome.storage.sync.get('user', function(rsp) {
  console.log('GithubTags', JSON.stringify(rsp, '\t', 2));
  axios.interceptors.request.use(
    config => {
      if (config.method === 'get') {
        config.params['token'] = rsp.user.token;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
});

function requestTagsByRepo(repoName, callback) {
  if (!repoName) {
    return;
  }
  axios
    .get('/api/get', { params: { repo: repoName } })
    .then(rsp => {
      callback(rsp.data.data);
    })
    .catch(error => {
      console.error(error);
    });
}

function requestTagsByRepoList(repoNameArray, callback) {
  axios
    .get('/api/get-list', { params: { repo_list: repoNameArray } })
    .then(rsp => {
      callback(rsp.data.data);
    })
    .catch(error => {
      console.error(error);
    });
}

function saveTagsByRepo(repoName, tags) {
  axios
    .get('/api/save', { params: { repo: repoName, tags: tags } })
    .then(rsp => {})
    .catch(error => {
      console.error(error);
    });
}

function searchTags(keyword, callback) {
  axios
    .get('/api/search', { params: { keyword: keyword } })
    .then(rsp => {
      callback(
        rsp.data.data.map(function(it) {
          it.project_name = it._id;
          return it;
        })
      );
    })
    .catch(error => {
      console.error(error);
    });
}

function getAllTags(callback) {
  axios
    .get('/api/get-all', { params: {} })
    .then(rsp => {
      callback(
        rsp.data.data.map(function(it) {
          it.project_name = it._id;
          return it;
        })
      );
    })
    .catch(error => {
      console.error(error);
    });
}
