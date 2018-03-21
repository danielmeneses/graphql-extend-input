const { engines: { node } } = require('./package.json');

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/preset-env',
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
    [
      '@babel/transform-runtime',
      {
        polyfill: false,
        regenerator: false
      }
    ]
  ]
};
