const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 6 },
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-flow',
  ],
  plugins: [
    // isDevelopment && 'react-refresh/babel',
    isDevelopment && '@babel/plugin-proposal-class-properties',
  ].filter(Boolean),
};
