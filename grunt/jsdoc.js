module.exports = function (grunt, options) {
  return {
    app: {
      src: ['README.md', 'src/**/*.js'],
      options: {
        destination: 'docs',
        configure: '.jsdocrc',
        private: false
      }
    }
  };
};