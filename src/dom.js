// require base classes that can be used in templates via data-class
define([
  'require',
  'jquery',
  'handlebars',
  'gsap',
  './templating',

  './dom/utils/touchmouse',

  './dom/Container',
  './dom/Stage',
  './dom/Module',
  './dom/Component',
  './dom/TransformableComponent',

  './dom/Moveable',
  './dom/Rotateable',
  './dom/Scaleable',
  './dom/Transformable',
  './dom/Scrollable',

  './vendor/fastclick'
], function(
  require,
  jquery,
  handlebars,
  templating,
  gsap,

  touchmouse,

  Container,
  Stage,
  Module,
  Component,
  TransformableComponent,

  Moveable,
  Rotateable,
  Scaleable,
  Transformable,
  Scrollable,

  fastclick
){
  // attach fastclick to body
  fastclick.attach(document.body);

  return {
    Container: Container,
    Stage: Stage,
    Module: Module,
    Component: Component,
    TransformableComponent: TransformableComponent,

    Moveable: Moveable,
    Rotateable: Rotateable,
    Scaleable: Scaleable,
    Transformable: Transformable,
    Scrollable: Scrollable
  };
});
