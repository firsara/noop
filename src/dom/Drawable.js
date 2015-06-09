// TODO: kill / move to app
define(['sys', 'dom/Container'], function(sys, Container) {

  var Parent = Container;

  var START = 'start';
  var DRAW = 'draw';
  var COMPLETE = 'complete';

  return sys.Class({
    __extends: Parent
  },
  function Drawable(template, data){
    // reference to instance
    var _this = this;

    _this.velocity = {delta: {}, direction: {}};
    _this._track = {};

    var _store = {points: []};

    var _changed = false;
    var _started = false;
    var _canvas = null;
    var _ctx = null;

    var Init = function(){
      // call super constructor
      if (Parent) Parent.call(_this, template, data);

      _this.autoPaint = false;

      _canvas = _this.el;
      _ctx = _canvas.getContext('2d');

      _this.on('addedToStage', _render, _this);
      _this.on('removedFromStage', _dispose, _this);
    };

    var _render = function(){
      _this.$el.addEventListener('mousedown', _mousedown);
      _this.addEventListener('tick', _enterFrame);
    };

    var _dispose = function(){
      _this.$el.removeEventListener('mousedown', _mousedown);
      _this.removeEventListener('tick', _enterFrame);
    };

    var _calculateVelocity = function(){
      var now = Date.now();
      var deltaTime = now - _this._track.time;

      _this.velocity.delta.x = _this._track.current.x - _this._track.start.x;
      _this.velocity.delta.y = _this._track.current.y - _this._track.start.y;

      _this.velocity.direction.x = _this.velocity.delta.x == 0 ? 0 : (_this.velocity.delta.x > 0 ? 1 : -1);
      _this.velocity.direction.y = _this.velocity.delta.y == 0 ? 0 : (_this.velocity.delta.y > 0 ? 1 : -1);

      _this.velocity.x = deltaTime == 0 ? 0 : Math.abs(_this.velocity.delta.x / deltaTime);
      _this.velocity.y = deltaTime == 0 ? 0 : Math.abs(_this.velocity.delta.y / deltaTime);
    };

    // store initial touchpoint-position
    var _mousedown = function(event){
      event.preventDefault();

      _this.stage.removeEventListener('mousemove', _pressmove);
      _this.stage.removeEventListener('mouseup', _pressup);

      _this.stage.addEventListener('mousemove', _pressmove);
      _this.stage.addEventListener('mouseup', _pressup);

      var now = Date.now();

      _store = {
        start: {x: event.pageX, y: event.pageY},
        old: {x: event.pageX, y: event.pageY},
        current: {x: event.pageX, y: event.pageY},
        points: [{x: event.pageX, y: event.pageY}]
      };

      _this._track.ticks = 0;
      _this._track.time = now;
      _this._track.start = {x: 0, y: 0, scale: 0, rotation: 0};
      _this._track.current = {x: 0, y: 0, scale: 0, rotation: 0};

      _calculateVelocity();

      _started = true;

      _this.dispatchEvent(START);
    };

    // update touchpoint-positions
    var _pressmove = function(event){
      _store.current.x = event.pageX;
      _store.current.y = event.pageY;
      _store.points.push({x: _store.current.x, y: _store.current.y});

      _changed = true;
    };

    // if positions changed (through pressmove): dispatch update-event for later usage and keep track of old point-position
    // dispatch updates only on tick to save some performance
    var _enterFrame = function(){
      if (_changed && _this._track.ticks > 0) {
        //_store.points.push({x: _store.current.x, y: _store.current.y});

        _changed = false;

        _this._track.current.x += (_store.current.x - _store.old.x);
        _this._track.current.y += (_store.current.y - _store.old.y);

        _store.old.x = _store.current.x;
        _store.old.y = _store.current.y;

        _draw();

        _this.dispatchEvent(DRAW);
      }


      if (_started) {
        _this._track.ticks++;

        // calculate velocity every 10 frames
        // gets better average values than taking the complete time into account
        if (_this._track.ticks > 10) {
          _calculateVelocity();

          _this._track.start.x = _this._track.current.x;
          _this._track.start.y = _this._track.current.y;
          _this._track.ticks = 0;
          _this._track.time = Date.now();
        }
      }
    };

    // delete old and unused finger-positions
    var _pressup = function(event){
      _this.stage.removeEventListener('mousemove', _pressmove);
      _this.stage.removeEventListener('mouseup', _pressup);

      _changed = false;
      _started = false;

      // calculate end velocity
      if (_this._track.ticks > 2) {
        _calculateVelocity();
      }

      _this.dispatchEvent(COMPLETE);

      // NOTE: store drawing part
    };



    var _getDistance = function(p1, p2) {
      var x = p2.x - p1.x;
      var y = p2.y - p1.y;

      return Math.sqrt((x * x) + (y * y));
    };

    var _draw = function(){
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

      _ctx.lineJoin = 'round';
      _ctx.lineCap = 'round';
      _ctx.strokeStyle = "#000000";

      var distanceEvery = 15;
      var tick = 0;
      var distance = 0;
      var calcDistance = 0;

      var controlPoints = [];
      var lastCheckedControlPointID = null;

      for (var i = 0, _len = _store.points.length - 4; i < _len; i += 4) {
        var startPoint1 = _store.points[i];
        var bezierPoint1 = _store.points[i+1];
        var endPoint1 = _store.points[i+2];

        var startPoint2 = _store.points[i+2];
        var bezierPoint2 = _store.points[i+3];
        var endPoint2 = _store.points[i+4];


        var calculatedBezierPoint1 = {};

        var t = 0.5;
        var p = [startPoint1, bezierPoint1, endPoint1];
        calculatedBezierPoint1.x = (1 - t) * (1 - t) * p[0].x + 2 * (1 - t) * t * p[1].x + t * t * p[2].x;
        calculatedBezierPoint1.y = (1 - t) * (1 - t) * p[0].y + 2 * (1 - t) * t * p[1].y + t * t * p[2].y;


        var calculatedBezierPoint2 = {};

        var t = 0.5;
        var p = [startPoint2, bezierPoint2, endPoint2];
        calculatedBezierPoint2.x = (1 - t) * (1 - t) * p[0].x + 2 * (1 - t) * t * p[1].x + t * t * p[2].x;
        calculatedBezierPoint2.y = (1 - t) * (1 - t) * p[0].y + 2 * (1 - t) * t * p[1].y + t * t * p[2].y;



/*
        _ctx.beginPath();
        var radius = 4;
        _ctx.fillStyle = '#0FF';
        _ctx.arc(calculatedBezierPoint1.x, calculatedBezierPoint1.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();

        _ctx.beginPath();
        var radius = 4;
        _ctx.fillStyle = '#0FF';
        _ctx.arc(calculatedBezierPoint2.x, calculatedBezierPoint2.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();

        _ctx.beginPath();
        var radius = 5;
        _ctx.fillStyle = '#F00';
        _ctx.arc(startPoint1.x, startPoint1.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();

        _ctx.beginPath();
        var radius = 5;
        _ctx.fillStyle = '#F00';
        _ctx.arc(endPoint2.x, endPoint2.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();

        _ctx.beginPath();
        var radius = 5;
        _ctx.fillStyle = '#F00';
        _ctx.arc(endPoint1.x, endPoint1.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();

        _ctx.beginPath();
        var radius = 5;
        _ctx.fillStyle = '#F00';
        _ctx.arc(startPoint2.x, startPoint2.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();

        _ctx.beginPath();
        var radius = 3;
        _ctx.fillStyle = '#0F0';
        _ctx.arc(bezierPoint1.x, bezierPoint1.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();

        _ctx.beginPath();
        var radius = 3;
        _ctx.fillStyle = '#0F0';
        _ctx.arc(bezierPoint2.x, bezierPoint2.y, radius, 0, 2 * Math.PI, false);
        _ctx.fill();
*/



        var controlPoint = {};
        controlPoint.from = startPoint1;
        controlPoint.to = endPoint2;
        controlPoint.through = [calculatedBezierPoint1, calculatedBezierPoint2];
        controlPoints.push(controlPoint);

        tick++;
      }



      var smoothedLineWidth = 0;
      var baseLineWidth = 0;

      for (var i = 0, _len = controlPoints.length; i < _len; i++) {
        var controlPoint = controlPoints[i];

        if (i % distanceEvery == 0) {
          var nextControlPointId = i+distanceEvery;
          var nextControlPoint = controlPoints[nextControlPointId];

          if (nextControlPoint) {
            distance = _getDistance(controlPoint.from, controlPoint.to);

            distance = Math.min(distance, 40);
            controlPoint.lineWidth = Math.max((40 - distance) / 2, 1);
            if (controlPoint.lineWidth < 1) controlPoint.lineWidth = 1;


            distance = _getDistance(nextControlPoint.from, nextControlPoint.to);

            distance = Math.min(distance, 40);
            nextControlPoint.lineWidth = Math.max((40 - distance) / 2, 1);
            if (nextControlPoint.lineWidth < 1) nextControlPoint.lineWidth = 1;

            smoothedLineWidth = nextControlPoint.lineWidth - controlPoint.lineWidth;
            smoothedLineWidth = smoothedLineWidth / distanceEvery;

            baseLineWidth = controlPoint.lineWidth;
          }
        } else {
          var diff = i % distanceEvery;
          controlPoint.lineWidth = baseLineWidth + smoothedLineWidth * diff;
        }
      }




      var smoothedLineWidth = 0;
      var baseLineWidth = 0;

      var tmpPoints = [];

      for (var i = 0, _len = _store.points.length - 1; i < _len; i++) {
        var controlPoint = _store.points[i];
        controlPoint.from = {x: _store.points[i].x, y: _store.points[i].y};
        controlPoint.to = {x: _store.points[i+1].x, y: _store.points[i+1].y};
        controlPoint.through = {x: (_store.points[i].x + _store.points[i+1].x) / 2, y: (_store.points[i].y + _store.points[i+1].y) / 2};
        tmpPoints.push(controlPoint);
      }

      for (var i = 0, _len = tmpPoints.length; i < _len; i++) {
        var controlPoint = tmpPoints[i];

        if (i % distanceEvery == 0) {
          var nextControlPointId = i+distanceEvery;
          var nextControlPoint = tmpPoints[nextControlPointId];

          if (! nextControlPoint) {
            nextControlPointId = _len - 1;
            nextControlPoint = tmpPoints[nextControlPointId];
          }

          distance = _getDistance(controlPoint.from, controlPoint.to);

          distance = Math.min(distance, 20);
          controlPoint.lineWidth = Math.max((20 - distance) / 3, 0.25);
          if (controlPoint.lineWidth < 1) controlPoint.lineWidth = 1;


          distance = _getDistance(nextControlPoint.from, nextControlPoint.to);

          distance = Math.min(distance, 20);
          nextControlPoint.lineWidth = Math.max((20 - distance) / 3, 0.25);
          if (nextControlPoint.lineWidth < 1) nextControlPoint.lineWidth = 1;

          smoothedLineWidth = nextControlPoint.lineWidth - controlPoint.lineWidth;
          smoothedLineWidth = smoothedLineWidth / (nextControlPointId - i);

          baseLineWidth = controlPoint.lineWidth;
        } else {
          var diff = i % distanceEvery;
          controlPoint.lineWidth = baseLineWidth + smoothedLineWidth * diff;
        }
      }




      var distanceEvery = 10;
      var tick = 0;
      var distance = 0;
      var calcDistance = 0;

      for (var i = _store.points.length - 4, _len = _store.points.length - 1; i < _len; i++) {
        controlPoint = _store.points[i];

        _ctx.beginPath();
        _ctx.lineWidth = controlPoint.lineWidth;

        _ctx.moveTo(controlPoint.from.x - 100, controlPoint.from.y);
        _ctx.quadraticCurveTo(controlPoint.through.x - 100, controlPoint.through.y, controlPoint.to.x - 100, controlPoint.to.y);
        //_ctx.bezierCurveTo(controlPoint.through[0].x - 100, controlPoint.through[0].y, controlPoint.through[1].x - 100, controlPoint.through[1].y, controlPoint.to.x - 100, controlPoint.to.y);

        tick++;

        _ctx.stroke();
      }




      var distanceEvery = 10;
      var tick = 0;
      var distance = 0;
      var calcDistance = 0;

      for (var i = 0, _len = _store.points.length - 1; i < _len; i++) {
        controlPoint = _store.points[i];

        _ctx.beginPath();
        _ctx.lineWidth = controlPoint.lineWidth;

        _ctx.moveTo(controlPoint.from.x, controlPoint.from.y);
        _ctx.quadraticCurveTo(controlPoint.through.x, controlPoint.through.y, controlPoint.to.x, controlPoint.to.y);
        //_ctx.bezierCurveTo(controlPoint.through[0].x, controlPoint.through[0].y, controlPoint.through[1].x, controlPoint.through[1].y, controlPoint.to.x, controlPoint.to.y);

        tick++;

        _ctx.stroke();
      }




      var distanceEvery = 10;
      var tick = 0;
      var distance = 0;
      var calcDistance = 0;

      for (var i = 0, _len = controlPoints.length; i < _len; i++) {
        var controlPoint = controlPoints[i];

        _ctx.beginPath();
        _ctx.lineWidth = controlPoint.lineWidth;

        _ctx.moveTo(controlPoint.from.x - 600, controlPoint.from.y);
        _ctx.bezierCurveTo(controlPoint.through[0].x - 600, controlPoint.through[0].y, controlPoint.through[1].x - 600, controlPoint.through[1].y, controlPoint.to.x - 600, controlPoint.to.y);

        tick++;

        _ctx.stroke();
      }


      // TODO: fill rest of points with quadraticcurve based on minimal approach
      // TODO: calculate distance and base line width first, then smooth out and re-calculate based on first calculations

    };

    // initialize instance
    Init();
  });
});
