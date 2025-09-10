import { createApp } from 'vue'
import App from '@/Views/App.vue'
import { registerPlugins } from '@/plugins'

const app = createApp(App)
registerPlugins(app)
app.mount('#app')
