import {createApp} from 'vue';
import App from './App.vue';
import {createPinia} from 'pinia';
import 'ant-design-vue/dist/antd.css';
import '@/assets/styles/index.scss'

const pinia = createPinia()
const app = createApp(App);
app.use(pinia)
app.mount('#app');