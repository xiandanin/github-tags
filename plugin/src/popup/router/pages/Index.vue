<template>
    <div class="container">
        <div class="row">
            <div class="col">
                <a href="https://gt.xiandan.in/oauth" target="_blank">获取Token</a>
            </div>
            <div class="col text-right">
                <a class="mr-3" href="https://github.com/dengyuhan/github-tags" target="_blank">Star一下</a>
                <a href="#" @click="handleClickEdit" v-show="!inputActive">编辑</a>
            </div>
        </div>
        <div class="input-group input-group-sm mt-2">
            <div class="input-group-prepend">
                <span class="input-group-text">Token</span>
            </div>
            <input type="text" class="form-control" v-model="userInfo.token"
                   placeholder="请输入Token" :readonly="inputActive ? false : 'readonly'"/>
        </div>
        <div class="row mt-2 no-gutters">
            <div class="col d-flex align-items-center user-info" v-if="userInfo&&userInfo.token">
                <img :src="userInfo.avatar" class="rounded-circle image-responsive" width="30"/><span class="ml-2">{{userInfo.nickname}}</span>
            </div>
            <div class="col text-right" v-show="inputActive">
                <button type="button" class="btn btn-outline-primary btn-sm" @click="handleSaveToken">保存</button>
            </div>
        </div>
        <div id="update_container" style="display: none">
            <hr/>
            <div style="font-size: 14px;color: black">有新版本 <a id="update_version" target="_blank"></a></div>
            <div id="update_message" style="color: #6f7180"></div>
        </div>
    </div>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                inputActive: false,
                userInfo: {
                    token: null
                }
            };
        },
        methods: {
            handleClickEdit() {
                this.inputActive = !this.inputActive
            },
            handleSaveToken() {
                if (this.userInfo.token) {
                    axios.get("/api/login", {headers: {"x-user-token": this.userInfo.token}})
                        .then(rsp => {
                            let user = rsp.data.data
                            if (user) {
                                chrome.storage.sync.set({user: user});
                                this.userInfo = user
                                this.inputActive = false
                            } else {
                                this.handleError(rsp.data.message)
                            }
                        }).catch((error) => {
                        console.error(new Date(), error)
                        this.handleError(error.message)
                    })
                }
            }, handleError(message) {
                chrome.notifications.create(null, {
                    type: 'basic',
                    iconUrl: '../icons/icon.png',
                    title: '提示',
                    message: message
                });
            }
        }, mounted() {
            let that = this
            chrome.storage.sync.get('user', function (rsp) {
                if (rsp && rsp.user && rsp.user.token) {
                    that.userInfo = rsp.user
                } else {
                    that.inputActive = true
                }
            });
        }
    };
</script>

<style lang="scss" scoped>

    .container {
        padding: 10px;
        width: 400px;
        font-size: 12px;
    }

    .form-control-sm, .input-group-sm > .form-control, .input-group-sm > .input-group-append > .btn, .input-group-sm > .input-group-append > .input-group-text, .input-group-sm > .input-group-prepend > .btn, .input-group-sm > .input-group-prepend > .input-group-text {
        font-size: 12px;
    }

    .btn-sm {
        font-size: 12px;
        min-width: 80px;
    }

    .error-message {
        max-width: 100px;
        color: red;
    }

    .user-info {
        min-height: 30px;
    }


</style>
