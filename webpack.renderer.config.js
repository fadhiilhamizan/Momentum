const webpack = require('webpack');
const rules = require('./webpack.rules');
const pkg = require('./package.json');

const cssRule = {
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
};

module.exports = {
  // target defaults to 'web' here so the renderer bundle is browser-safe
  // (no __dirname / native-module runtime).
  target: 'web',
  module: {
    rules: [...rules, cssRule],
  },
  plugins: [
    // Single source of truth for the app version, injected at build time.
    new webpack.DefinePlugin({
      'process.env.APP_VERSION': JSON.stringify(pkg.version),
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.json'],
  },
};
