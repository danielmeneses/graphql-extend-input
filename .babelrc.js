const { engines: { node } } = require('./package.json');

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/preset-es2015',
      {
        shippedProposals: true,
        modules: process.env.MODULE ? false : 'commonjs',
        useBuiltIns: 'usage',
        targets: {
          node: node.substring(2) // remove >= from the version defined in package.json
        }
      }
    ]
  ],
  plugins: [
    'add-module-exports',
    [
      '@babel/transform-runtime',
      {
        polyfill: false,
        regenerator: false
      }
    ]
  ]
};
