window.onload = function () {
    document.getElementById("btn_import").onclick = clickImport
    document.getElementById("btn_export").onclick = clickExport
}


function clickImport() {
    var input = document.createElement('input');
    input.type = "file"
    input.accept = "application/json"
    input.onchange = function () {
        var reader = new FileReader();//新建一个FileReader
        reader.readAsText(this.files[0], "UTF-8");//读取文件
        reader.onload = function (evt) { //读取完文件之后会回来这里
            var json = evt.target.result; // 读取文件内容
            chrome.storage.sync.set(JSON.parse(json));

            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'images/icon.png',
                title: '导入',
                message: '导入成功！'
            });
        }
    }
    input.click()

}
function clickExport() {
    chrome.storage.sync.get('items', function (rsp) {
        // 创建隐藏的可下载链接
        var date = new Date();
        var filename = "github-tags_" + date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + "_" + date.getHours() + "-" + date.getMinutes() + ".json";
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