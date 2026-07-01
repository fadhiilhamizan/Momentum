// Shared loader rules (both main and renderer). Native-module handling lives
// only in the main config — the renderer has no native deps, and the asset
// relocator's runtime references __dirname, which breaks a plain-browser build.
module.exports = [
  {
    test: /\.(m?js|jsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        exclude: /node_modules/,
        presets: [
          '@babel/preset-env',
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    },
  },
];
