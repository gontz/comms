/*
   Copyright 2026 Marc Nuri San Felix

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
const fs = require('node:fs');
const path = require('node:path');
const {protocol} = require('electron');
const {loadSettings} = require('../settings');

// Service pages are remote sites: they can't load fonts from the application files, and most of
// them have a Content-Security-Policy whose font-src blocks data: URLs too. A privileged scheme
// with bypassCSP is the one way to hand them the bundled interface font.
const FONT_SCHEME = 'electronim-font';
const FONT_FAMILY = 'ElectronIM Interface';
const DEFAULT_INTERFACE_STACK = '\'Inclusive Sans\', Roboto, sans-serif';
const CODE_ELEMENTS = 'code, pre, kbd, samp, tt';
const FONTS_DIR = path.resolve(__dirname, '..', 'styles', 'base', 'fonts');
const FONTS = [
  {
    file: 'inclusive-sans-latin-ext.woff2',
    unicodeRange: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF'
  },
  {
    file: 'inclusive-sans-latin.woff2',
    unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
  }
];

// Elements that must keep the site's own font: code (monospace) and icon fonts. Icon fonts render
// glyphs from ligatures or private-use code points, so a text font turns them into letters.
const EXCLUDED = [
  'code', 'pre', 'kbd', 'samp', 'tt', 'svg', 'math',
  '[class*="icon" i]', '[class*="symbol" i]', '[class*="glyph" i]', '[class*="material" i]',
  '[class*="tgico"]', '.fa', '.fas', '.far', '.fab', '[class^="fa-"]', '[class*=" fa-"]', '[data-icon]'
].join(', ');

// Must be called once, before the app's ready event.
const registerFontScheme = () => protocol.registerSchemesAsPrivileged([{
  scheme: FONT_SCHEME,
  privileges: {standard: true, secure: true, bypassCSP: true, corsEnabled: true}
}]);

const handleFontRequest = async request => {
  const file = new URL(request.url).pathname.replace(/^\//, '');
  if (!FONTS.some(font => font.file === file)) {
    return new Response(null, {status: 404});
  }
  const data = await fs.promises.readFile(path.join(FONTS_DIR, file));
  return new Response(data, {headers: {'Content-Type': 'font/woff2', 'Access-Control-Allow-Origin': '*'}});
};

const addFontProtocol = session => {
  if (!session.fontProtocolHandler) {
    session.protocol.handle(FONT_SCHEME, handleFontRequest);
    session.fontProtocolHandler = true;
  }
};

// Optional fonts installed on this computer, named in settings.json (interfaceFontFamily and
// codeFontFamily). Installed fonts are not subject to the pages' CSP. The value ends up in CSS, so
// anything other than a plain family name is ignored.
const fontFamily = name => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return /^[\p{L}\p{N} _-]{1,100}$/u.test(trimmed) ? `'${trimmed}'` : null;
};

const customFonts = ({interfaceFontFamily, codeFontFamily} = {}) => ({
  interfaceFont: fontFamily(interfaceFontFamily),
  codeFont: fontFamily(codeFontFamily)
});

const codeFontRule = codeFont => (codeFont ?
  `:is(${CODE_ELEMENTS}), :is(${CODE_ELEMENTS}) * {\n  font-family: ${codeFont}, monospace !important;\n}` : '');

const fontOverrideCss = (settings = {}) => {
  const {interfaceFont, codeFont} = customFonts(settings);
  const stack = [interfaceFont, `'${FONT_FAMILY}'`, DEFAULT_INTERFACE_STACK].filter(Boolean).join(', ');
  return [
    ...FONTS.map(({file, unicodeRange}) => `@font-face {
  font-family: '${FONT_FAMILY}'; font-style: normal; font-weight: 300 700; font-display: swap;
  src: url('${FONT_SCHEME}://fonts/${file}') format('woff2'); unicode-range: ${unicodeRange};
}`),
    `*:not(${EXCLUDED}):not(:is(${EXCLUDED}) *) {\n  font-family: ${stack} !important;\n}`,
    codeFontRule(codeFont)
  ].filter(Boolean).join('\n');
};

// ElectronIM's own pages: override the Material 3 typeface variables
const appFontCss = (settings = {}) => {
  const {interfaceFont, codeFont} = customFonts(settings);
  return [
    interfaceFont && `:root {
  --md-ref-typeface-plain: ${interfaceFont}, ${DEFAULT_INTERFACE_STACK} !important;
  --md-ref-typeface-brand: ${interfaceFont}, ${DEFAULT_INTERFACE_STACK} !important;
}`,
    codeFontRule(codeFont)
  ].filter(Boolean).join('\n');
};

// cssOrigin 'user': a user stylesheet's !important wins over the site's own !important rules
const applyFontOverride = webContents => webContents
  .insertCSS(fontOverrideCss(loadSettings()), {cssOrigin: 'user'})
  .catch(error => console.error('Error applying the interface font to a service', error));

const isAppPage = webContents => (webContents.getURL() ?? '').startsWith('file:');

// Listener for the app's web-contents-created event: applies the custom fonts to ElectronIM's pages
const applyAppFonts = (_event, webContents) => {
  webContents.on('dom-ready', () => {
    if (!isAppPage(webContents)) {
      return;
    }
    const css = appFontCss(loadSettings());
    if (css) {
      webContents.insertCSS(css)
        .catch(error => console.error('Error applying the custom fonts to ElectronIM', error));
    }
  });
};

module.exports = {
  FONT_SCHEME, addFontProtocol, appFontCss, applyAppFonts, applyFontOverride, fontOverrideCss, handleFontRequest,
  registerFontScheme
};
