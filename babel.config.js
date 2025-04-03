module.exports = {
  presets: [
    ['@babel/preset-env', {
      // modules: 'commonjs' // Explicitly target CommonJS for Jest
      modules: false // Let the explicit plugin handle modules
    }]
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs' // Add this explicitly
  ]
};
