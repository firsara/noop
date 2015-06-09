module.exports = function (grunt, options) {
  return {
    options: {
      files: ['package.json', 'bower.json'],
      updateConfigs: ['pkg', 'bwr'],
      commit: true,
      commitMessage: 'Release v%VERSION%',
      commitFiles: ['.'],
      createTag: true,
      tagName: 'v%VERSION%',
      tagMessage: 'Version %VERSION%',
      push: true,
      pushTo: 'origin master',
      gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
      globalReplace: false,
      prereleaseName: false,
      regExp: false
    }
  };
};