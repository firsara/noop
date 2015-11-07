define([
  './utils/console',
  './utils/css3',
  './utils/fps',
  './utils/Context',
  './utils/dispatch'
], function(
  console,
  css3,
  fps,
  Context,
  dispatch
){
  return {
    css3: css3,
    fps: fps,
    Context: Context,
    dispatch: dispatch
  };
});
