// https://github.com/nwjs/nw.js/wiki/Faq-name-conflict
// work around name conflict between nodejs and requirejs in nwjs
require.nodeRequire = window.requireNode;
window.nodeRequire = window.requireNode;

require.config({
  shim: {
    'app.config': {
      exports: 'config'
    }
  },
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
    'noop/all'
  ],
  function(noop) {
    $('html, body').css('height', '100%');
    $('html, body').css('overflow', 'hidden');

    var main = noop.dom.Container.create('<div style="background: ' + noop.config.color + '">');
    $('body').addChild(main);

    main.el.style.width = screen.width / 2 + 'px';
    main.el.style.height = screen.height / 2 + 'px';
    main.x = screen.width / 4;
    main.y = screen.height / 6;
    main.paint();

    var mover = new noop.dom.MoveClip('<div style="width: 200px; height: 200px; background: ' + noop.config.color2 + '"></div>');
    mover.x = screen.width / 4 - 100;
    mover.y = 100;
    mover.borders.x = [0, screen.width / 2 - 200];
    mover.borders.y = [0, screen.height / 2 - 200];
    mover.elastic.x = 0.25;
    mover.elastic.y = 0.25;
    main.addChild(mover);
  });
});