module.exports = function (grunt, options) {
  return {
    options: {
      jshintrc: true,
    },
    src: ['src/**/*.js', '!src/vendor/**/*.js', '!src/dom/Drawable.js'],
  };
};