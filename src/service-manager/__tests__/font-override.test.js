/**
 * @jest-environment node
 */
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
describe('Service Manager font override test suite', () => {
  let electron;
  let fontOverride;
  beforeEach(() => {
    jest.resetModules();
    electron = require('../../__tests__').testElectron();
    fontOverride = require('../font-override');
  });
  describe('registerFontScheme', () => {
    beforeEach(() => {
      fontOverride.registerFontScheme();
    });
    test('registers the scheme as able to bypass the Content-Security-Policy of the page', () => {
      expect(electron.protocol.registerSchemesAsPrivileged).toHaveBeenCalledWith([{
        scheme: 'electronim-font',
        privileges: {standard: true, secure: true, bypassCSP: true, corsEnabled: true}
      }]);
    });
  });
  describe('handleFontRequest', () => {
    describe('bundled font', () => {
      let response;
      beforeEach(async () => {
        response = await fontOverride.handleFontRequest({url: 'electronim-font://fonts/inclusive-sans-latin.woff2'});
      });
      test('responds 200', () => {
        expect(response.status).toBe(200);
      });
      test('responds with the woff2 content type', () => {
        expect(response.headers.get('Content-Type')).toBe('font/woff2');
      });
      test('responds with the font file', async () => {
        const body = Buffer.from(await response.arrayBuffer());
        expect(body.subarray(0, 4).toString()).toBe('wOF2');
      });
    });
    test.each([
      'electronim-font://fonts/material-symbols-outlined.woff2',
      'electronim-font://fonts/../../../package.json',
      'electronim-font://fonts/%2e%2e%2fsettings.json',
      'electronim-font://fonts/'
    ])('any other file (%s), responds 404', async url => {
      const response = await fontOverride.handleFontRequest({url});
      expect(response.status).toBe(404);
    });
  });
  describe('addFontProtocol', () => {
    let session;
    beforeEach(() => {
      session = {protocol: {handle: jest.fn()}};
      fontOverride.addFontProtocol(session);
      fontOverride.addFontProtocol(session);
    });
    test('registers the handler once per session', () => {
      expect(session.protocol.handle).toHaveBeenCalledTimes(1);
    });
  });
  describe('fontOverrideCss', () => {
    describe('without custom fonts', () => {
      let css;
      beforeEach(() => {
        css = fontOverride.fontOverrideCss({});
      });
      test('declares the bundled font through the privileged scheme', () => {
        expect(css).toContain('src: url(\'electronim-font://fonts/inclusive-sans-latin.woff2\')');
      });
      test('uses the bundled font first, with !important', () => {
        expect(css).toMatch(/font-family: 'ElectronIM Interface', 'Inclusive Sans', Roboto, sans-serif !important/);
      });
      test.each(['code', 'pre', '[class*="icon" i]', '[class*="material" i]'])('excludes %s and its content', selector => {
        expect(css).toMatch(new RegExp(String.raw`:not\([^)]*${RegExp.escape(selector)}`));
      });
      test('leaves the code font alone', () => {
        expect(css).not.toContain('monospace');
      });
    });
    describe('with custom fonts', () => {
      let css;
      beforeEach(() => {
        css = fontOverride.fontOverrideCss({interfaceFontFamily: ' My Text Font ', codeFontFamily: 'My_Code-Font 2'});
      });
      test('uses the custom interface font first, then the bundled font', () => {
        expect(css).toContain('font-family: \'My Text Font\', \'ElectronIM Interface\', \'Inclusive Sans\'');
      });
      test('uses the custom code font for code and its content', () => {
        expect(css).toContain(':is(code, pre, kbd, samp, tt), :is(code, pre, kbd, samp, tt) * {\n  font-family: \'My_Code-Font 2\', monospace !important;');
      });
    });
    test.each([
      ['CSS injection', 'Evil\'; } body { display: none'],
      ['non-string', 42],
      ['empty', '   ']
    ])('with an invalid custom font (%s), ignores it', (_name, interfaceFontFamily) => {
      expect(fontOverride.fontOverrideCss({interfaceFontFamily})).toEqual(fontOverride.fontOverrideCss({}));
    });
  });
  describe('appFontCss', () => {
    test('without custom fonts, is empty', () => {
      expect(fontOverride.appFontCss({})).toBe('');
    });
    describe('with custom fonts', () => {
      let css;
      beforeEach(() => {
        css = fontOverride.appFontCss({interfaceFontFamily: 'My Text Font', codeFontFamily: 'My Code Font'});
      });
      test('overrides the plain typeface variable', () => {
        expect(css).toContain('--md-ref-typeface-plain: \'My Text Font\', \'Inclusive Sans\', Roboto, sans-serif !important;');
      });
      test('overrides the brand typeface variable', () => {
        expect(css).toContain('--md-ref-typeface-brand: \'My Text Font\', \'Inclusive Sans\', Roboto, sans-serif !important;');
      });
      test('sets the code font', () => {
        expect(css).toContain('font-family: \'My Code Font\', monospace !important;');
      });
    });
  });
  describe('with settings', () => {
    let settings;
    beforeEach(async () => {
      settings = await require('../../__tests__').testSettings();
      settings.updateSettings({interfaceFontFamily: 'My Text Font'});
    });
    describe('applyFontOverride', () => {
      let webContents;
      beforeEach(() => {
        webContents = {insertCSS: jest.fn(async () => 'key')};
      });
      test('inserts the stylesheet for the saved fonts as a user stylesheet', async () => {
        await fontOverride.applyFontOverride(webContents);
        expect(webContents.insertCSS).toHaveBeenCalledWith(
          fontOverride.fontOverrideCss({interfaceFontFamily: 'My Text Font'}), {cssOrigin: 'user'});
      });
      test('logs instead of throwing when the page is gone', async () => {
        webContents.insertCSS = jest.fn(async () => {
          throw new Error('destroyed');
        });
        jest.spyOn(console, 'error').mockImplementationOnce(() => {});
        await fontOverride.applyFontOverride(webContents);
        expect(console.error).toHaveBeenCalledWith('Error applying the interface font to a service', expect.any(Error));
      });
    });
    describe('applyAppFonts', () => {
      let webContents;
      beforeEach(() => {
        webContents = new (require('node:events'))();
        webContents.insertCSS = jest.fn(async () => 'key');
        fontOverride.applyAppFonts({}, webContents);
      });
      test('ElectronIM page, inserts the custom fonts on dom-ready', () => {
        webContents.getURL = () => 'file:///opt/electronim/src/settings/index.html';
        webContents.emit('dom-ready');
        expect(webContents.insertCSS).toHaveBeenCalledWith(fontOverride.appFontCss({interfaceFontFamily: 'My Text Font'}));
      });
      test('service page, inserts nothing', () => {
        webContents.getURL = () => 'https://web.whatsapp.com/';
        webContents.emit('dom-ready');
        expect(webContents.insertCSS).not.toHaveBeenCalled();
      });
      test('ElectronIM page without custom fonts, inserts nothing', () => {
        settings.updateSettings({interfaceFontFamily: null});
        webContents.getURL = () => 'file:///opt/electronim/src/settings/index.html';
        webContents.emit('dom-ready');
        expect(webContents.insertCSS).not.toHaveBeenCalled();
      });
    });
  });
});
