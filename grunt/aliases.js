module.exports = function (grunt, options) {
  return {
    'default': [
      'watch'
    ],

    'lint': [
      'jshint',
      'jscs'
    ],

    'docs': [
      'clean:docs',
      'jsdoc'
    ]
  };
};