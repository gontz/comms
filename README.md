# ElectronIM
[![GitHub license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/manusa/electronim/blob/master/LICENSE)
[<img src="https://github.com/manusa/electronim/workflows/Tests/badge.svg" />](https://github.com/manusa/electronim/actions)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=manusa_electronim&metric=bugs)](https://sonarcloud.io/dashboard?id=manusa_electronim) 
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=manusa_electronim&metric=coverage)](https://sonarcloud.io/dashboard?id=manusa_electronim)
[![npm](https://img.shields.io/npm/v/electronim)](https://www.npmjs.com/package/electronim)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/manusa/electronim?sort=semver)](https://github.com/manusa/electronim/releases/latest)
[![electronim](https://snapcraft.io//electronim/badge.svg)](https://snapcraft.io/electronim)
[![Chocolatey Version](https://img.shields.io/chocolatey/v/electronim)](https://community.chocolatey.org/packages/electronim)


Free/Libre open source Electron based multi instant messaging (IM) client.

Combine all your IM applications (or whatever you want) in a single browser (Electron) window.

## This fork

This is a fork of [manusa/electronim](https://github.com/manusa/electronim), kept in sync with upstream. It adds:

- 🪟 **Allow popups** (per service, under the service's advanced settings): popup windows opened by the page,
  such as Microsoft sign-in windows, open inside ElectronIM instead of being blocked.
  Ordinary links still open in your default browser.
- 🔑 **Passkey fallback**: Electron has no passkey ("Face, fingerprint, PIN or security key") dialog, so on Linux
  (and presumably macOS) those requests used to hang the sign-in. They now fail straight away, as if cancelled, so sites
  such as Microsoft offer their other sign-in methods (Authenticator app, code, password).
  Windows is unchanged, as it uses the native Windows Hello dialog.
- 🕵️ A clean Chrome user-agent for every service.
- 🎨 A new application icon.
- 🔤 [Inclusive Sans](https://fonts.google.com/specimen/Inclusive+Sans) as the interface font (bundled, so no
  network is needed; SIL Open Font License, see `src/styles/base/fonts/inclusive-sans-OFL.txt`).
  Roboto remains the fallback. When the [Nerd Font](https://www.nerdfonts.com/) build
  *InclusiveSans Nerd Font Propo* is installed on the system it is used first (all weights, real italics and
  the Nerd icons).
  Turn on **Settings → Appearance → Use the ElectronIM font in services** to apply it to the services' web pages
  too. Icons and code keep their own font; if a service looks wrong, turn it off again.

To sync with upstream:

```
git remote add upstream https://github.com/manusa/electronim.git   # once
git fetch upstream && git merge upstream/main
```

To build and install the Linux AppImage locally:

```
npm install
npx node-gyp@11 rebuild --directory=node_modules/nodehun   # npm 12 blocks nodehun's install script
npm run build:linux -- AppImage
cp dist/electronim-linux-x86_64.AppImage ~/.local/bin/electronim.AppImage
```

## Quickstart

Detailed guides for installation can be followed in our comprehensive [setup guide](docs/Setup.md).

Download the latest binary version for your platform:
[releases](https://github.com/manusa/electronim/releases/latest)

Or if you have Node installed in your system, you can try out ElectronIM by running one of the following commands:

```
npx electronim
```

```
npm install -g electronim
electronim
```

## Features

- ⚛ Multi-platform: ElectronIM is available for Linux 🐧, Mac 🍏 and Windows.
- 🌍 Based on Chromium 152.
- 🔔 Desktop notifications: ElectronIM will notify you using your native system notifications.
- 🧐 Spellchecker: ElectronIM contains spellchecker dictionaries for many languages,
  if your language is not supported, just [file an issue](https://github.com/manusa/electronim/issues/new).
- 🕸 Supports any web based IM solution.
- 👋 Drag-and-drop services/tab reordering.
- 🔒 Configurable context for services (Isolated/sandboxed or shared). i.e. You can have multiple tabs/instances of the same service/web application if the context is sandboxed.
- 🔕 Notifications can be disabled for individual Applications.
- 💤 Notifications can be disabled globally (Do not disturb).
- ⌨ Keyboard [shortcuts](docs/Keyboard-shortcuts.md).
- 🖥️ Screen sharing: Share your screen securely with any web service that supports it (e.g. Google Meet, Microsoft Teams, Zoom, and so on).
- 🎨 Appearance customization:
  - 🌗 Light and Dark themes with system override.
  - 🏷️ Custom application title to personalize your ElectronIM window.
- 🗕 System Tray.
- 📌 Always on top: Keep ElectronIM window on top of other applications.
- 🔎 Find in page.
- 📊 Task Manager: Monitor and manage application processes with memory and CPU usage metrics.
- 🚫 No tracking: ElectronIM respects your privacy, no account registration is needed and no telemetry, analytics, or tracking of any kind is performed.

## [Screenshot](docs/Screenshots.md)

![Screenshot](docs/screenshots/main.png)

## Motivation

Inspired by [Rambox](https://github.com/ramboxapp/community-edition) and [Franz](https://github.com/meetfranz/franz), I created **ElectronIM** out of the necessity for an all-in-one instant messaging app that did not require registration, provided spell checking for free, and ensured maximum user privacy by never tracking user activity or sending telemetry data.
With built-in screen sharing and strict privacy principles, ElectronIM offers a secure and flexible communication hub.

## Documentation

0. [Setup Guide](docs/Setup.md)
0. [Keyboard Shortcuts](docs/Keyboard-shortcuts.md)
0. [Troubleshooting](docs/Troubleshooting.md)

## Acknowledgements

- [Electron](https://electronjs.org/)
- [Preact](https://github.com/preactjs/preact)
- [Chrome tabs](https://github.com/adamschwartz/chrome-tabs#readme)
- [Nodehun](https://github.com/Wulf/nodehun/)
- [Woorm's dictionary repo](https://github.com/wooorm/dictionaries)
