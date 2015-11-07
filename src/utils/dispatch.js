/*
 * dispatch.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function(){

  /**
   * helper function to dispatch event on a given object<br>
   * optionally pass in data to the event
   *
   * @method dispatch
   * @memberof utils
   * @param {Object} obj which should dispatch the event
   * @param {String} name custom event name
   * @param {data} data (optional) that should be added to the event
   **/
  var dispatch = function(obj, name, data){
    var event = new Event(name, {
      bubbles: true,
      cancelable: true
    });

    if (data && typeof data === 'object') {
      for (var k in data) {
        if (data.hasOwnProperty(k)) {
          event[k] = data[k];
        }
      }
    }

    if (obj) {
      obj.dispatchEvent(event);
    }

    return event;
  };

  /**
   * helper function to create a custom event with optional data
   *
   * @method create
   * @memberof utils.dispatch
   * @param {String} name custom event name
   * @param {data} data (optional) that should be added to the event
   **/
  dispatch.create = function(name, data){
    var event = new Event(name, {
      bubbles: true,
      cancelable: true
    });

    if (data && typeof data === 'object') {
      for (var k in data) {
        if (data.hasOwnProperty(k)) {
          event[k] = data[k];
        }
      }
    }

    return event;
  };

  return dispatch;
});
