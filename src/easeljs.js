define([
  './easeljs/MoveClip',
  './easeljs/RotateClip',
  './easeljs/ScaleClip',
  './easeljs/TransformClip'
], function(
  MoveClip,
  RotateClip,
  ScaleClip,
  TransformClip
){
  return {
    MoveClip: MoveClip,
    RotateClip: RotateClip,
    ScaleClip: ScaleClip,
    TransformClip: TransformClip
  }
});
