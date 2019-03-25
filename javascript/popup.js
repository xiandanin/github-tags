var appid_id = "bmob-appid";
var apikey_id = "bmob-apikey";
var btn_save_id = "btn-save-appid";
var btn_edit_id = "btn-edit-appid";
var old_version_id = "div-old-version";
var show_stars_tags = "show-stars-tags";

var current_version = "1.1.2"

window.onload = function () {
    chrome.storage.sync.get("is_migrate", function (rsp) {
        var display = rsp.is_migrate == true ? "none" : "block";
        if (display) {
            document.getElementById(old_version_id).removeAttribute("style")
        } else {
            document.getElementById(old_version_id).style.display = "none"
        }
    })

    chrome.storage.sync.get(null, function (rsp) {
        document.getElementById(appid_id).value = rsp.appid == undefined ? "" : rsp.appid
        document.getElementById(apikey_id).value = rsp.apikey == undefined ? "" : rsp.apikey
        const empty = isAPPKeyEmpty(rsp);
        if (!empty) {
            Bmob.initialize(rsp.appid, rsp.apikey);
        }
        setEditState(empty)
    });

    document.getElementById(btn_save_id).onclick = function () {
        var bmob = {}
        bmob.appid = document.getElementById(appid_id).value
        bmob.apikey = document.getElementById(apikey_id).value
        chrome.storage.sync.set(bmob);
        chrome.storage.sync.get(null, function (rsp) {
            Bmob.initialize(rsp.appid, rsp.apikey);
            console.log("Bmob Application ID：" + rsp.appid + "\n" + "Bmob REST API Key：" + rsp.apikey + "\n" + "保存成功")
            document.getElementById(appid_id).value = rsp.appid
            document.getElementById(apikey_id).value = rsp.apikey

            setEditState(false)
            //showMessage("保存成功！", true)
        });
    }

    document.getElementById(btn_edit_id).onclick = function () {
        setEditState(true)
    }

    /**
     * 导入旧版数据并迁移
     */
    document.getElementById("btn-import-migrate").onclick = function () {
        chrome.storage.sync.get(null, function (rsp) {
            var empty = isAPPKeyEmpty(rsp)
            if (empty) {
                showMessage("请先设置appid和apikey")
                return
            }
            var input = document.createElement('input');
            input.type = "file"
            input.accept = "application/json"
            input.onchange = function () {
                var reader = new FileReader();//新建一个FileReader
                reader.readAsText(this.files[0], "UTF-8");//读取文件
                reader.onload = function (evt) { //读取完文件之后会回来这里
                    var json = evt.target.result; // 读取文件内容
                    migrateLocalDataToCloud(json)
                }
            }
            input.click()

        });
    }

    /**
     * 导出旧版数据
     */
    document.getElementById("btn-export-old").onclick = function () {
        chrome.storage.local.get('items', function (rsp) {
            // 创建隐藏的可下载链接
            var date = new Date();
            var filename = "github-tags_" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "_" + date.getHours() + "-" + date.getMinutes() + ".json";
            var eleLink = document.createElement('a');
            eleLink.download = filename;
            eleLink.style.display = 'none';
            // 字符内容转变成blob地址
            var blob = new Blob([JSON.stringify(rsp)]);
            eleLink.href = URL.createObjectURL(blob);
            // 触发点击
            document.body.appendChild(eleLink);
            eleLink.click();
            // 然后移除
            document.body.removeChild(eleLink);
        });
    }

    //更新提示
    var ajax = new XMLHttpRequest();
    ajax.open('get', 'https://raw.githubusercontent.com/dengyuhan/github-tags/master/update.json');
    ajax.send();
    ajax.onreadystatechange = function () {
        if (ajax.readyState == 4 && ajax.status == 200) {
            document.getElementById("update_container").removeAttribute("style")
            var response = JSON.parse(ajax.responseText)
            console.log((current_version == response.version) + "--->" + current_version + "--->" + response.version);
            if (current_version < response.version) {
                var version = document.getElementById("update_version")
                version.setAttribute("href", response.link)
                version.innerHTML = "v" + response.version
                document.getElementById("update_message").innerHTML = response.message
            } else {
                document.getElementById("update_container").style.display = "none"
            }
            console.log(ajax.responseText);
        } else {
            document.getElementById("update_container").style.display = "none"
        }
    }
}

/**
 * 设置编辑状态
 * @param edit
 */
function setEditState(edit) {
    document.getElementById(appid_id).readOnly = !edit;
    document.getElementById(apikey_id).readOnly = !edit;
    document.getElementById(btn_edit_id).style.display = edit ? "none" : "block";
    if (edit) {
        document.getElementById(btn_save_id).removeAttribute("style")
    } else {
        document.getElementById(btn_save_id).style.display = edit ? "block" : "none";
    }
}


/**
 * 迁移本地数据到云
 */
function migrateLocalDataToCloud(json) {
    //如果有数据
    if (json != null && json.length > 0) {
        const data = JSON.parse(json);
        if (data.length > 0) {
            const saveArray = new Array();
            for (let i = 0; i < data.length; i++) {
                const tags = data[i].tags;
                if (tags != null && tags != undefined && tags.length > 0) {
                    const saveObj = Bmob.Query('project_tags');
                    saveObj.set('project_name', data[i].project_name);
                    saveObj.set('tag_name_array', JSON.stringify(tags));
                    saveArray.push(saveObj);
                }
            }
            Bmob.Query('project_tags').saveAll(saveArray).then(result => {
                chrome.storage.sync.set({"is_migrate": true})
                //清空本地数据
                chrome.storage.local.set({})

                showMessage("成功迁移" + result.length + "条数据")
                console.log("数据迁移成功：\n" + JSON.stringify(result, null, 2));
            }).catch(err => {
                showMessage("数据迁移失败")
                console.log("数据迁移失败\n" + err);
            });
        }
    }
}

function isAPPKeyEmpty(bmob) {
    if (bmob == undefined || bmob.appid == undefined || bmob.apikey == undefined) {
        return true
    }
    return JSON.stringify(bmob) == '{}' || bmob.appid.length <= 0 || bmob.apikey.length <= 0
}

function showMessage(message) {
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'images/icon.png',
        title: '提示',
        message: message
    });
}
