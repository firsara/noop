module.exports = function (grunt, options) {
  return {
    target: {
      rjsConfig: 'require.config.js',
      options: {
        baseUrl: './examples/basic'
      }
    }
  };
};