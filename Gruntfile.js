module.exports = function (grunt) {
  var path = require('path');

  require('load-grunt-config')(grunt, {
    // auto grunt.initConfig
    init: true,

    // configuration data and options
    data: {
      pkg: grunt.file.readJSON('package.json'),
      bwr: grunt.file.readJSON('.bowerrc')
    },

    // can optionally pass options to load-grunt-tasks.
    // If you set to false, it will disable auto loading tasks.
    loadGruntTasks: {
      pattern: ['grunt-*', '@*/grunt-*'],
      config: require('./package.json'),
      scope: ['devDependencies']
    }
  });
};