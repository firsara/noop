define([
  './utils/console',
  './utils/css3',
  './utils/fps',
  './utils/Context'
], function(
  console,
  css3,
  fps,
  Context
){
  return {
    css3: css3,
    fps: fps,
    Context: Context
  };
});
