module.exports = function (grunt, options) {
  return {
    options: {
      config: '.jscsrc',
    },
    src: ['src/**/*.js', '!src/vendor/**/*.js', '!src/dom/Drawable.js'],
  };
};