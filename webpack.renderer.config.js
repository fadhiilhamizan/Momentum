const rules = require('./webpack.rules');

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
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.json'],
  },
};
