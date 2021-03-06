var Util = require('./modules/util');
var debounce = require('./modules/debounce');
var ForceCamera = require('./modules/force_camera');

var vector_mouse_down = new THREE.Vector2();
var vector_mouse_move = new THREE.Vector2();
var vector_mouse_end = new THREE.Vector2();

var canvas = null;
var renderer = null;
var scene = null;
var camera = null;

var running = null;
var sketches = require('./sketches');
var sketch_id = 0;

var metas = document.getElementsByTagName('meta');
var btn_toggle_menu = document.querySelector('.btn-switch-menu');
var menu = document.querySelector('.menu');
var select_sketch = document.querySelector('.select-sketch');
var sketch_title = document.querySelector('.sketch-title');
var sketch_date = document.querySelector('.sketch-date');
var sketch_description = document.querySelector('.sketch-description');

var initThree = function() {
  canvas = document.getElementById('canvas');
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    toneMapping: THREE.NoToneMapping,
  });
  if (!renderer) {
    alert('Three.jsの初期化に失敗しました。');
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvas.appendChild(renderer.domElement);
  renderer.setClearColor(0x000000, 1.0);

  scene = new THREE.Scene();

  camera = new ForceCamera(35, window.innerWidth / window.innerHeight, 1, 10000);
};

var init = function() {
  setSketchId();
  buildMenu();
  initThree();
  startRunSketch(sketches[sketches.length - sketch_id]);
  renderloop();
  setEvent();
  debounce(window, 'resize', function(event){
    resizeRenderer();
  });
};

var getParameterByName = function(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

var setSketchId = function() {
  sketch_id = getParameterByName('sketch_id');
  if (sketch_id == null || sketch_id > sketches.length || sketch_id < 1) {
    sketch_id = sketches.length;
  }
};

var buildMenu = function() {
  for (var i = 0; i < sketches.length; i++) {
    var sketch = sketches[i];
    var dom = document.createElement('li');
    dom.setAttribute('data-index', i);
    dom.innerHTML = '<span>' + sketch.name + '</span>';
    dom.addEventListener('click', function() {
      switchSketch(sketches[this.getAttribute('data-index')]);
    });
    select_sketch.appendChild(dom);
  }
};

var startRunSketch = function(sketch) {
  running = new sketch.obj(scene, camera, renderer);
  sketch_title.innerHTML = sketch.name;
  sketch_date.innerHTML = (sketch.update.length > 0)
                          ? 'posted: ' + sketch.posted + ' / update: ' + sketch.update
                          : 'posted: ' + sketch.posted;
  sketch_description.innerHTML = sketch.description;
};

var switchSketch = function(sketch) {
  running.remove(scene, camera);
  startRunSketch(sketch);
  switchMenu();
};

var render = function() {
  renderer.clear();
  running.render(scene, camera, renderer);
  renderer.render(scene, camera);
};

var renderloop = function() {
  var now = Date.now();
  requestAnimationFrame(renderloop);
  render();
};

var resizeRenderer = function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.resize(window.innerWidth, window.innerHeight);
  resizeWindow();
};

var setEvent = function () {
  canvas.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('selectstart', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('mousedown', function (event) {
    event.preventDefault();
    touchStart(event.clientX, event.clientY, false);
  });

  canvas.addEventListener('mousemove', function (event) {
    event.preventDefault();
    touchMove(event.clientX, event.clientY, false);
  });

  canvas.addEventListener('mouseup', function (event) {
    event.preventDefault();
    touchEnd(event.clientX, event.clientY, false);
  });

  canvas.addEventListener('touchstart', function (event) {
    event.preventDefault();
    touchStart(event.touches[0].clientX, event.touches[0].clientY, true);
  });

  canvas.addEventListener('touchmove', function (event) {
    event.preventDefault();
    touchMove(event.touches[0].clientX, event.touches[0].clientY, true);
  });

  canvas.addEventListener('touchend', function (event) {
    event.preventDefault();
    touchEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY, true);
  });

  window.addEventListener('mouseout', function () {
    event.preventDefault();
    mouseOut();
  });

  btn_toggle_menu.addEventListener('click', function(event) {
    event.preventDefault();
    switchMenu();
  });
};

var transformVector2d = function(vector) {
  vector.x = (vector.x / window.innerWidth) * 2 - 1;
  vector.y = - (vector.y / window.innerHeight) * 2 + 1;
};

var touchStart = function(x, y, touch_event) {
  vector_mouse_down.set(x, y);
  transformVector2d(vector_mouse_down);
  if (running.touchStart) running.touchStart(scene, camera, vector_mouse_down);
};

var touchMove = function(x, y, touch_event) {
  vector_mouse_move.set(x, y);
  transformVector2d(vector_mouse_move);
  if (running.touchMove) running.touchMove(scene, camera, vector_mouse_down, vector_mouse_move);
};

var touchEnd = function(x, y, touch_event) {
  vector_mouse_end.set(x, y);
  if (running.touchEnd) running.touchEnd(scene, camera, vector_mouse_end);
};

var mouseOut = function() {
  vector_mouse_end.set(0, 0);
  if (running.mouseOut) running.mouseOut(scene, camera);
};

var switchMenu = function() {
  btn_toggle_menu.classList.toggle('is-active');
  menu.classList.toggle('is-active');
  document.body.classList.remove('is-pointed');
};

var resizeWindow = function() {
  if (running.resizeWindow) running.resizeWindow(scene, camera);
};


init();
