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
// Electron has no WebAuthn user interface (the browser's "security window" for passkeys and
// security keys), so navigator.credentials.get/create({publicKey}) never settles (verified on Linux
// with Electron 44; macOS has no such UI either) and sign-in pages such as Microsoft's wait forever
// on "Face, fingerprint, PIN or security key".
// Reject those requests the way a browser does when the user cancels the dialog (NotAllowedError),
// so the page falls back to its other sign-in methods. On Windows Chromium delegates WebAuthn to
// the native Windows Hello dialog, which works, so it is left untouched there.

const notSupported = () => Promise.reject(new DOMException(
  'Passkeys and security keys are not supported in ElectronIM', 'NotAllowedError'));

const shimCredentials = credentials => {
  for (const method of ['get', 'create']) {
    const native = credentials[method];
    if (typeof native === 'function') {
      credentials[method] = function(options) {
        return options?.publicKey ? notSupported() : native.call(credentials, options);
      };
    }
  }
};

const shimPublicKeyCredential = PublicKeyCredentialClass => {
  PublicKeyCredentialClass.isUserVerifyingPlatformAuthenticatorAvailable = async () => false;
  PublicKeyCredentialClass.isConditionalMediationAvailable = async () => false;
};

if (process.platform !== 'win32') {
  if (globalThis.navigator?.credentials) {
    shimCredentials(globalThis.navigator.credentials);
  }
  if (globalThis.PublicKeyCredential) {
    shimPublicKeyCredential(globalThis.PublicKeyCredential);
  }
}
