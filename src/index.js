/*
   Copyright 2019 Marc Nuri San Felix

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
const {app, ipcMain: eventBus} = require('electron');
// Fix GTK 2/3 and GTK 4 conflict on Linux (Electron 36 issue)
// This must be done before importing any other electron module
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('gtk-version', '3');
}
const {registerAppShortcuts} = require('./base-window');
const {parseSettingsPath, parseUserData} = require('./cli');
const {APP_EVENTS} = require('./constants');
const {init, quit} = require('./main');
const {setSettingsPath} = require('./settings');
const {applyAppFonts, registerFontScheme} = require('./service-manager/font-override');

const args = process.argv.slice(process.defaultApp ? 2 : 1);
// Parse command line arguments for custom user data directory
const customUserData = parseUserData(args);
if (customUserData) {
  app.setPath('userData', customUserData);
}

// Parse command line arguments for custom settings path
const customSettingsPath = parseSettingsPath(args);
if (customSettingsPath) {
  setSettingsPath(customSettingsPath);
}

// Only one instance per user data directory: a second launch hands over to the running instance,
// which brings its window back (from the tray or minimized), and then quits. The lock lives in the
// user data directory, so it has to be requested after --user-data is applied, which keeps separate
// profiles (--user-data) running side by side.
if (app.requestSingleInstanceLock()) {
  registerFontScheme();

  app.on('second-instance', () => eventBus.emit(APP_EVENTS.restore));
  app.on('ready', init);
  app.on('quit', quit);
  app.on('web-contents-created', registerAppShortcuts);
  app.on('web-contents-created', applyAppFonts);
} else {
  app.quit();
}
