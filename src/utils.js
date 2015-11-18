define([
  './utils/console',
  './utils/css3',
  './utils/fps',
  './utils/Context',
  './utils/dispatch',
  './utils/EventDispatcher'
], function(
  console,
  css3,
  fps,
  Context,
  dispatch,
  EventDispatcher
){
  return {
    css3: css3,
    fps: fps,
    Context: Context,
    dispatch: dispatch,
    EventDispatcher: EventDispatcher
  };
});
