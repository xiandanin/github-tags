import Vue from 'vue';
import App from './App';
import store from '../store';
import router from './router';
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.css'

//axios.defaults.baseURL = 'http://localhost:9000/';
axios.defaults.baseURL = 'https://gt.xiandan.in/';

global.browser = require('webextension-polyfill');
Vue.prototype.$browser = global.browser;

/* eslint-disable no-new */
new Vue({
    el: '#app',
    store,
    router,
    render: h => h(App),
});
