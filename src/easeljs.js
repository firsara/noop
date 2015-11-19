define([
  './easeljs/Moveable',
  './easeljs/Rotateable',
  './easeljs/Scaleable',
  './easeljs/Transformable'
], function(
  Moveable,
  Rotateable,
  Scaleable,
  Transformable
){
  return {
    Moveable: Moveable,
    Rotateable: Rotateable,
    Scaleable: Scaleable,
    Transformable: Transformable
  };
});
