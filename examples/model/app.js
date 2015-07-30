require.config({
  paths: {
    noop: '../../src/'
  }
});


// require all configurations
define([
  '../../require.config'
],
function(){
  // require basic setup, config and dependencies
  require([
    'noop/config',
    'noop/data/API',
    'noop/data/Model',
    'noop/data/Collection',
    'jquery',
    'models/User',
    'models/Project'
  ],
  function(config, API, Model) {
    API.endpoint = config.endpoint;

    var user = Model.factory('User', 1);
    user.autoPull = true; // autoPull all associated relations
    user.pull(function(user){
      $('<pre>'+user.serialize(true)+'</pre>').appendTo($('body'));

      $('<pre>'+user.projects[0].serialize(true)+'</pre>').appendTo($('body'));
    });
  });
});