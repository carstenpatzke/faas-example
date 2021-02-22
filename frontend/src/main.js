import Vue from 'vue'
import App from './App.vue'
import router from './router'
import {setup} from './apiclient';

Vue.config.productionTip = false

setup();

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
