/*
 * css3.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function(){
  /**
   * css3 helper functions
   * @namespace utils.css3
   * @memberof utils
   */
  var css3 = {};

  /**
   * get transform style prefix based on defined vendor prefixes
   *
   * @var {String} transformStylePrefix
   * @memberof utils.css3
   **/
  css3.transformStylePrefix = (function(){
    var prefix = 'transform';

    if (! (prefix in document.body.style)) {
      var v = ['ms', 'Khtml', 'O', 'moz', 'Moz', 'webkit', 'Webkit'];

      while (v.length) {
        var prop = v.pop() + 'Transform';
        if (prop in document.body.style) {
          prefix = prop;
        }
      }
    }

    return prefix;
  })();

  /**
   * get transform style prefix based on defined vendor prefixes
   *
   * @var {String} transformOriginStylePrefix
   * @memberof utils.css3
   **/
  css3.transformOriginStylePrefix = (function(){
    var prefix = 'transformOrigin';

    if (! (prefix in document.body.style)) {
      var v = ['ms', 'Khtml', 'O', 'moz', 'Moz', 'webkit', 'Webkit'];

      while (v.length) {
        var prop = v.pop() + 'Transform';
        if (prop in document.body.style) {
          prefix = prop;
        }
      }
    }

    return prefix;
  })();

  /**
   * get transform style prefix based on defined vendor prefixes
   *
   * @var {String} transformOriginStylePrefix
   * @memberof utils.css3
   **/
  css3.columnCountStylePrefix = (function(){
    var prefix = 'columnCount';

    if (! (prefix in document.body.style)) {
      var v = ['ms', 'Khtml', 'O', 'moz', 'Moz', 'webkit', 'Webkit'];

      while (v.length) {
        var prop = v.pop() + 'ColumnCount';
        if (prop in document.body.style) {
          prefix = prop;
        }
      }
    }

    return prefix;
  })();

  /**
   * get css filter style property based on defined vendor prefixes
   *
   * @var {String} filterStylePrefix
   * @memberof utils.css3
   **/
  css3.filterStylePrefix = (function(){
    var prefix = 'unknownFilter';

    if (! (prefix in document.body.style)) {
      var v = ['ms', 'Khtml', 'O', 'moz', 'Moz', 'webkit', 'Webkit'];

      while (v.length) {
        var prop = v.pop() + 'Filter';
        if (prop in document.body.style) {
          prefix = prop;
        }
      }
    }

    if (prefix === 'unknownFilter') {
      prefix = 'filter';
    }

    return prefix;
  })();

  /**
   * extracts css3 transform rotation based on an html dom element
   *
   * @method getRotation
   * @memberof utils.css3
   * @param {DomElement} domElement of which transformation should be extracted
   **/
  css3.getRotation = function(domElement){
    // TODO: make simpler
    //var matrix = domElement.style[css3.transformStylePrefix];

    var obj = $(domElement);
    var matrix = obj.css('-webkit-transform') ||
                 obj.css('-moz-transform')    ||
                 obj.css('-ms-transform')     ||
                 obj.css('-o-transform')      ||
                 obj.css('transform');

    var angle = 0;

    if (matrix !== 'none') {
      var values = matrix.split('(')[1].split(')')[0].split(',');
      var a = values[0];
      var b = values[1];
      angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    } else {
      angle = 0;
    }

    return (angle < 0) ? angle + 360 : angle;
  };

  return css3;
});
