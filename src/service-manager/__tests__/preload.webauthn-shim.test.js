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
describe('WebAuthn Shim test suite', () => {
  let originalPlatform;
  let nativeGet;
  let nativeCreate;
  const loadShim = platform => {
    Object.defineProperty(process, 'platform', {value: platform});
    jest.isolateModules(() => require('../preload.webauthn-shim'));
  };
  beforeEach(() => {
    originalPlatform = process.platform;
    nativeGet = jest.fn(async () => 'native-get');
    nativeCreate = jest.fn(async () => 'native-create');
    Object.defineProperty(globalThis.navigator, 'credentials', {
      configurable: true, value: {get: nativeGet, create: nativeCreate}
    });
    globalThis.PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: async () => true,
      isConditionalMediationAvailable: async () => true
    };
  });
  afterEach(() => {
    Object.defineProperty(process, 'platform', {value: originalPlatform});
    delete globalThis.navigator.credentials;
    delete globalThis.PublicKeyCredential;
  });
  describe('on Linux', () => {
    beforeEach(() => {
      loadShim('linux');
    });
    describe.each(['get', 'create'])('navigator.credentials.%s with publicKey', method => {
      let result;
      beforeEach(async () => {
        result = await navigator.credentials[method]({publicKey: {challenge: new Uint8Array(32)}})
          .catch(error => error);
      });
      test('rejects with NotAllowedError, as if the user cancelled', () => {
        expect(result.name).toBe('NotAllowedError');
      });
      test('does not call the native implementation', () => {
        expect(method === 'get' ? nativeGet : nativeCreate).not.toHaveBeenCalled();
      });
    });
    test('navigator.credentials.get without publicKey, delegates to the native implementation', async () => {
      expect(await navigator.credentials.get({password: true})).toBe('native-get');
    });
    test('navigator.credentials.create without publicKey, delegates to the native implementation', async () => {
      expect(await navigator.credentials.create({password: {}})).toBe('native-create');
    });
    test('isUserVerifyingPlatformAuthenticatorAvailable resolves false', async () => {
      expect(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()).toBe(false);
    });
    test('isConditionalMediationAvailable resolves false', async () => {
      expect(await PublicKeyCredential.isConditionalMediationAvailable()).toBe(false);
    });
  });
  describe('on Windows', () => {
    beforeEach(() => {
      loadShim('win32');
    });
    test('navigator.credentials.get is not shimmed', () => {
      expect(navigator.credentials.get).toBe(nativeGet);
    });
    test('isUserVerifyingPlatformAuthenticatorAvailable is not shimmed', async () => {
      expect(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()).toBe(true);
    });
  });
  describe('without WebAuthn support', () => {
    beforeEach(() => {
      delete globalThis.navigator.credentials;
      delete globalThis.PublicKeyCredential;
    });
    test('loads without errors', () => {
      expect(() => loadShim('linux')).not.toThrow();
    });
  });
});
