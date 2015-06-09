module.exports = function (grunt, options) {
  return {
    app: {
      src: ['README.md', 'src/**/*.js', '!src/vendor/**/*.js', '!src/dom/Drawable.js'],
      options: {
        destination: 'docs',
        configure: '.jsdocrc',
        private: false
      }
    }
  };
};