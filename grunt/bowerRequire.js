module.exports = function (grunt, options) {
  return {
    target: {
      rjsConfig: 'src/require.config.js',
      options: {
        baseUrl: './src/app'
      }
    }
  };
};