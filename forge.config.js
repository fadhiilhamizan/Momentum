const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const mainConfig = require('./webpack.main.config');
const rendererConfig = require('./webpack.renderer.config');

module.exports = {
  packagerConfig: {
    name: 'Momentum',
    executableName: 'momentum',
    asar: true,
    icon: './assets/icon',
    // sql.js is loaded at runtime (not webpack-bundled), so its JS loader and
    // .wasm binary are shipped as resources next to the packaged app.
    extraResource: [
      './node_modules/sql.js/dist/sql-wasm.js',
      './node_modules/sql.js/dist/sql-wasm.wasm',
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'momentum',
        setupIcon: './assets/icon.ico',
        // Code signing (optional): set these env vars to a Windows code-signing
        // certificate to sign the installer + app and avoid SmartScreen warnings.
        // Requires an OV/EV certificate from a CA (self-signed will NOT clear
        // SmartScreen). See README → Code signing.
        ...(process.env.WINDOWS_CERT_FILE
          ? {
              certificateFile: process.env.WINDOWS_CERT_FILE,
              certificatePassword: process.env.WINDOWS_CERT_PASSWORD,
            }
          : {}),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig,
        devContentSecurityPolicy:
          "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
        renderer: {
          config: rendererConfig,
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/main/preload.js',
              },
            },
          ],
        },
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
