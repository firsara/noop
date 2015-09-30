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

  './dom/MoveClip',
  './dom/RotateClip',
  './dom/ScaleClip',
  './dom/TransformClip',
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

  MoveClip,
  RotateClip,
  ScaleClip,
  TransformClip,
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

    MoveClip: MoveClip,
    RotateClip: RotateClip,
    ScaleClip: ScaleClip,
    TransformClip: TransformClip,
    Scrollable: Scrollable
  };
});
