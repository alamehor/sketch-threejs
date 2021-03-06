var Util = require('../modules/util');
var glslify = require('glslify');
var ForceCamera = require('../modules/force_camera');
var Force2 = require('../modules/force2');

var exports = function(){
  var Sketch = function(scene, camera) {
    this.init(scene, camera);
  };

  var points = null;
  var bg = null;
  var bg_wf = null;
  var obj = null;
  var light = new THREE.DirectionalLight(0xffffff, 1);

  var sub_scene = new THREE.Scene();
  var sub_camera = new ForceCamera(45, 1, 1, 10000);
  var render_target = new THREE.WebGLRenderTarget(1200, 1200);
  var framebuffer = null;

  var sub_scene2 = new THREE.Scene();
  var sub_camera2 = new ForceCamera(45, 1, 1, 10000);
  var sub_light = new THREE.HemisphereLight(0xfffffff, 0xcccccc, 1);
  var render_target2 = new THREE.WebGLRenderTarget(1200, 1200);
  var bg_fb = null;
  var points_fb = null;

  var force = new Force2();

  var createPointsForCrossFade = function() {
    var geometry = new THREE.BufferGeometry();
    var vertices_base = [];
    var radians_base = [];
    for (let i = 0; i < 32; i ++) {
      var x = 0;
      var y = 0;
      var z = 0;
      vertices_base.push(x, y, z);
      var r1 = Util.getRadian(Util.getRandomInt(0, 360));
      var r2 = Util.getRadian(Util.getRandomInt(0, 360));
      var r3 = Util.getRadian(Util.getRandomInt(0, 360));
      radians_base.push(r1, r2, r3);
    }
    var vertices = new Float32Array(vertices_base);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var radians = new Float32Array(radians_base);
    geometry.addAttribute('radian', new THREE.BufferAttribute(radians, 3));
    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0.0
        },
        resolution: {
          type: 'v2',
          value: new THREE.Vector2(window.innerWidth, window.innerHeight)
        },
        size: {
          type: 'f',
          value: 28.0
        },
        force: {
          type: 'v2',
          value: force.velocity,
        },
      },
      vertexShader: glslify('../../glsl/sketch/hole/points.vs'),
      fragmentShader: glslify('../../glsl/sketch/hole/points.fs'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Points(geometry, material);
  };

  var createObject = function() {
    var geometry_base = new THREE.SphereBufferGeometry(2, 4, 4);
    var attr = geometry_base.attributes;
    var geometry = new THREE.BufferGeometry();
    var vertices_base = [];
    var radiuses_base = [];
    var radians_base = [];
    var scales_base = [];
    var indices_base = [];
    for (let i = 0; i < 16; i ++) {
      var radius = Util.getRandomInt(300, 1000);
      var radian = Util.getRadian(Util.getRandomInt(0, 3600) / 10);
      var scale = Util.getRandomInt(60, 120) / 100;
      for (var j = 0; j < attr.position.array.length; j += 3) {
        vertices_base.push(
          attr.position.array[j + 0],
          attr.position.array[j + 1],
          attr.position.array[j + 2]
        );
        radiuses_base.push(radius);
        radians_base.push(radian);
        scales_base.push(scale);
      }
      geometry_base.index.array.map((item) => {
        indices_base.push(item + i * attr.position.array.length / 3)
      });
    }
    var vertices = new Float32Array(vertices_base);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var radius = new Float32Array(radiuses_base);
    geometry.addAttribute('radius', new THREE.BufferAttribute(radius, 1));
    var radians = new Float32Array(radians_base);
    geometry.addAttribute('radian', new THREE.BufferAttribute(radians, 1));
    var scales = new Float32Array(scales_base);
    geometry.addAttribute('scale', new THREE.BufferAttribute(scales, 1));
    var indices = new Uint32Array(indices_base);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    var material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        {
          time: {
            type: 'f',
            value: 0,
          },
        }
      ]),
      vertexShader: glslify('../../glsl/sketch/hole/object.vs'),
      fragmentShader: glslify('../../glsl/sketch/hole/object.fs'),
      shading: THREE.FlatShading,
      lights: true,
    });
    return new THREE.Mesh(geometry, material);
  };

  var createBackground = function() {
    var geometry = new THREE.SphereGeometry(1200, 64, 64);
    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: glslify('../../glsl/sketch/hole/bg.vs'),
      fragmentShader: glslify('../../glsl/sketch/hole/bg.fs'),
      side: THREE.BackSide,
    });
    return new THREE.Mesh(geometry, material);
  };

  var createBackgroundWire = function() {
    var geometry = new THREE.SphereGeometry(1100, 64, 64);
    var material = new THREE.MeshBasicMaterial({
      color: 0xdddddd,
      wireframe: true
    });
    return new THREE.Mesh(geometry, material);
  };

  var createPointsInFramebuffer = function() {
    var geometry = new THREE.BufferGeometry();
    var vertices_base = [];
    for (var i = 0; i < 2000; i++) {
      vertices_base.push(
        Util.getRadian(Util.getRandomInt(0, 120) + 120),
        Util.getRadian(Util.getRandomInt(0, 3600) / 10),
        Util.getRandomInt(200, 1000)
      );
    }
    var vertices = new Float32Array(vertices_base);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: glslify('../../glsl/sketch/hole/fb_points.vs'),
      fragmentShader: glslify('../../glsl/sketch/hole/fb_points.fs'),
    });
    return new THREE.Points(geometry, material);
  };

  var createBackgroundInFramebuffer = function() {
    var geometry_base = new THREE.SphereGeometry(1000, 128, 128);
    var geometry = new THREE.BufferGeometry();
    geometry.fromGeometry(geometry_base);
    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: glslify('../../glsl/sketch/hole/fb_bg.vs'),
      fragmentShader: glslify('../../glsl/sketch/hole/fb_bg.fs'),
      side: THREE.BackSide,
    });
    return new THREE.Mesh(geometry, material);
  };

  var createPlaneForFramebuffer = function() {
    var geometry_base = new THREE.PlaneGeometry(1000, 1000);
    var geometry = new THREE.BufferGeometry();
    geometry.fromGeometry(geometry_base);
    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0,
        },
        resolution: {
          type: 'v2',
          value: new THREE.Vector2(window.innerWidth, window.innerHeight)
        },
        texture: {
          type: 't',
          value: render_target,
        },
        texture2: {
          type: 't',
          value: render_target2,
        },
      },
      vertexShader: glslify('../../glsl/sketch/hole/fb.vs'),
      fragmentShader: glslify('../../glsl/sketch/hole/fb.fs'),
      transparent: true
    });
    return new THREE.Mesh(geometry, material);
  };

  Sketch.prototype = {
    init: function(scene, camera) {
      document.body.className = 'bg-white';
      force.anchor.set(1, 0);

      sub_camera2.force.position.anchor.set(1000, 300, 0);
      sub_camera2.force.look.anchor.set(0, 0, 0);
      bg_fb = createBackgroundInFramebuffer();
      points_fb = createPointsInFramebuffer();
      sub_scene2.add(bg_fb);
      sub_scene2.add(points_fb);
      sub_scene2.add(sub_light);

      points = createPointsForCrossFade();
      sub_scene.add(points);
      sub_camera.position.set(0, 0, 3000);
      sub_camera.lookAt(0, 0, 0);

      framebuffer = createPlaneForFramebuffer();
      scene.add(framebuffer);
      bg = createBackground();
      scene.add(bg);
      bg_wf = createBackgroundWire();
      scene.add(bg_wf);
      obj = createObject();
      scene.add(obj);
      light.position.set(0, 1, 0)
      scene.add(light);
      camera.force.position.anchor.set(1000, 300, 0);
      camera.force.look.anchor.set(0, 0, 0);

      this.resizeWindow();
    },
    remove: function(scene) {
      document.body.className = '';
      bg_fb.geometry.dispose();
      bg_fb.material.dispose();
      sub_scene2.remove(bg_fb);
      points_fb.geometry.dispose();
      points_fb.material.dispose();
      sub_scene2.remove(points_fb);
      sub_scene2.remove(sub_light);

      points.geometry.dispose();
      points.material.dispose();
      sub_scene.remove(points);

      framebuffer.geometry.dispose();
      framebuffer.material.dispose();
      scene.remove(framebuffer);
      bg.geometry.dispose();
      bg.material.dispose();
      scene.remove(bg);
      bg_wf.geometry.dispose();
      bg_wf.material.dispose();
      scene.remove(bg_wf);
      obj.geometry.dispose();
      obj.material.dispose();
      scene.remove(obj);
      scene.remove(light);
    },
    render: function(scene, camera, renderer) {
      points.material.uniforms.time.value++;
      framebuffer.lookAt(camera.position);
      framebuffer.material.uniforms.time.value++;

      bg_fb.material.uniforms.time.value++;
      points_fb.material.uniforms.time.value++;

      bg_wf.rotation.y = points.material.uniforms.time.value / 1000;
      obj.material.uniforms.time.value++;

      force.applyHook(0, 0.12);
      force.applyDrag(0.18);
      force.updateVelocity();
      camera.force.position.applyHook(0, 0.025);
      camera.force.position.applyDrag(0.2);
      camera.force.position.updateVelocity();
      camera.updatePosition();
      camera.force.look.anchor.y = Math.sin(points.material.uniforms.time.value / 100) * 100;
      camera.force.look.applyHook(0, 0.2);
      camera.force.look.applyDrag(0.4);
      camera.updateLook();
      sub_camera2.force.position.applyHook(0, 0.1);
      sub_camera2.force.position.applyDrag(0.2);
      sub_camera2.force.position.updateVelocity();
      sub_camera2.updatePosition();
      sub_camera2.force.look.applyHook(0, 0.2);
      sub_camera2.force.look.applyDrag(0.4);
      sub_camera2.force.look.updateVelocity();
      sub_camera2.updateLook();
      renderer.render(sub_scene2, sub_camera2, render_target2);
      renderer.render(sub_scene, sub_camera, render_target);
    },
    touchStart: function(scene, camera, vector) {
      force.anchor.set(2, 30);
    },
    touchMove: function(scene, camera, vector_mouse_down, vector_mouse_move) {
    },
    touchEnd: function(scene, camera, vector_mouse_end) {
      force.anchor.set(1, 0);
    },
    mouseOut: function(scene, camera) {
      force.anchor.set(1, 0);
    },
    resizeWindow: function(scene, camera) {
      points.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
      framebuffer.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }
  };

  return Sketch;
};

module.exports = exports();
