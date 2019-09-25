<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <a href="https://gt.xiandan.in/api/oauth" target="_blank">获取Token</a>
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
      <input type="text" class="form-control" v-model="userInfo.token" placeholder="请输入Token" :readonly="inputActive ? false : 'readonly'" />
    </div>
    <div class="row mt-2 no-gutters">
      <div class="col d-flex align-items-center user-info" v-if="userInfo && userInfo.token">
        <img :src="userInfo.avatar" class="rounded-circle image-responsive" width="30" /><span class="ml-2">{{ userInfo.nickname }}</span>
      </div>
      <div class="col text-right" v-show="inputActive">
        <button type="button" class="btn btn-outline-primary btn-sm" @click="handleSaveToken">保存</button>
      </div>
    </div>
    <div v-if="updateInfo" class="border-top mt-2 pt-2">
      <div style="font-size: 14px;color: black">
        有新版本 <a :href="updateInfo.link" target="_blank">{{ updateInfo.version }}</a>
      </div>
      <div style="color: #6f7180">{{ updateInfo.message }}</div>
    </div>
  </div>
</template>
å
<script>
import axios from 'axios';
import config from '../../../../package.json';

export default {
  data() {
    return {
      inputActive: false,
      userInfo: {
        token: null,
      },
      updateInfo: null,
    };
  },
  methods: {
    handleClickEdit() {
      this.inputActive = !this.inputActive;
    },
    handleSaveToken() {
      if (this.userInfo.token) {
        axios
          .get('/api/login', { headers: { 'x-user-token': this.userInfo.token } })
          .then(rsp => {
            let user = rsp.data.data;
            if (user) {
              chrome.storage.sync.set({ user: user });
              this.userInfo = user;
              this.inputActive = false;
            } else {
              this.handleError(rsp.data.message);
            }
          })
          .catch(error => {
            console.error(new Date(), error);
            this.handleError(error.message);
          });
      }
    },
    handleError(message) {
      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: '../icons/icon.png',
        title: '提示',
        message: message,
      });
    },
    checkUpdate() {
      axios
        .get('https://raw.githubusercontent.com/dengyuhan/github-tags/master/update.json')
        .then(rsp => {
          if (rsp.data && rsp.data.version) {
            let ver = parseInt(rsp.data.version.replace(new RegExp(/\./, 'g'), ''));
            let c_ver = parseInt(config.version.replace(new RegExp(/\./, 'g'), ''));
            if (ver > c_ver) {
              this.updateInfo = rsp.data;
            }
          }
        })
        .catch(error => {
          console.error(new Date(), error);
        });
    },
  },
  mounted() {
    this.checkUpdate();
    let that = this;
    chrome.storage.sync.get('user', function(rsp) {
      if (rsp && rsp.user && rsp.user.token) {
        that.userInfo = rsp.user;
      } else {
        that.inputActive = true;
      }
    });
  },
};
</script>

<style lang="scss" scoped>
.container {
  padding: 10px;
  width: 400px;
  font-size: 12px;
}

.form-control-sm,
.input-group-sm > .form-control,
.input-group-sm > .input-group-append > .btn,
.input-group-sm > .input-group-append > .input-group-text,
.input-group-sm > .input-group-prepend > .btn,
.input-group-sm > .input-group-prepend > .input-group-text {
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
