/**
 * plugins/vuetify.ts
 */

// Styles
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';

// Composables
import { createVuetify } from 'vuetify';

const vuetify = createVuetify({
  components,
  directives,
  ssr: true, // SSRを使用する場合
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#5CBBF6',
          background: '#ececec',
        },
      },
    },
  },
});

export default vuetify;
