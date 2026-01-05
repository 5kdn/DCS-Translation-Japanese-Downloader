/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

import type { App } from 'vue';
import vuetify from './vuetify';

/**
 * @summary Vue アプリへプラグインを登録する。
 * @param app 登録対象の Vue アプリケーションを指定する。
 */
export function registerPlugins(app: App): void {
  app.use(vuetify);
}
