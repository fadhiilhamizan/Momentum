const rules = require('./webpack.rules');

// Native-module handling — main process only.
const nativeRules = [
  {
    // The asset relocator generates a "fake" .node file which is really a cjs
    // file; load it with node-loader.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: { outputAssetBase: 'native_modules' },
    },
  },
];

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/index.js',
  module: {
    rules: [...nativeRules, ...rules],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  // sql.js is loaded from node_modules at runtime (its .wasm is copied via
  // extraResource) instead of being bundled, which avoids emscripten/webpack
  // interop issues.
  externals: {
    'sql.js': 'commonjs sql.js',
  },
};
