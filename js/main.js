//~~~~~~~Import Three.js~~~~~~~
import * as THREE from 'three';

// Import add-ons
import { OrbitControls } from 'https://unpkg.com/three@0.162.0/examples/jsm/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// variables
let container, scene, camera, renderer;
let cameraControls;
let mixer;
let sphereGroup, smallSphere;
let groundMirror, verticalMirror;
let mask;
let butterfly;

let mouseX = 0;
let mouseY = 0;

let petalMeshes,
  petalCount = 6,
  rotationStep = (Math.PI * 2) / petalCount;

init();
animate();

function init() {
  container = document.getElementById('container');

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // scene
  scene = new THREE.Scene();

  // camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    500
  );
  camera.position.set(0, 75, 160);

  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 40, 0);
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 10;
  cameraControls.update();

  const planeGeo = new THREE.PlaneGeometry(100.1, 100.1);

  // mirrors
  let geometry;

  geometry = new THREE.CircleGeometry(40, 64);
  groundMirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * devicePixelRatio,
    textureHeight: window.innerHeight * devicePixelRatio,
    color: 0xb5b5b5
  });
  groundMirror.position.y = 0.5;
  groundMirror.rotateX(-Math.PI / 2);
  scene.add(groundMirror);

  geometry = new THREE.PlaneGeometry(100, 100);
  verticalMirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * devicePixelRatio,
    textureHeight: window.innerHeight * devicePixelRatio,
    color: 0xc1cbcb
  });
  verticalMirror.position.y = 50;
  verticalMirror.position.z = -50;
  scene.add(verticalMirror);

  // sphere group
  sphereGroup = new THREE.Object3D();
  scene.add(sphereGroup);

  // small sphere
  geometry = new THREE.IcosahedronGeometry(4, 0);
  const material = new THREE.MeshPhongMaterial({
    color: 0xc4b454,
    emissive: 0x05445e,
    flatShading: true
  });

  smallSphere = new THREE.Mesh(geometry, material);
  scene.add(smallSphere);

  // textures
  const doorTexture = new THREE.TextureLoader().load('door3.png');
  const vineTexture = new THREE.TextureLoader().load('plants.png');

  const planeFront = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ map: doorTexture })
  );
  planeFront.position.set(0, 50, 50);
  planeFront.rotateY(Math.PI);
  scene.add(planeFront);

  const planeRight = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ map: vineTexture })
  );
  planeRight.position.set(50, 50, 0);
  planeRight.rotateY(-Math.PI / 2);
  scene.add(planeRight);

  const planeLeft = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ map: vineTexture })
  );
  planeLeft.position.set(-50, 50, 0);
  planeLeft.rotateY(Math.PI / 2);
  scene.add(planeLeft);

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
  directionalLight.position.y = 2;
  scene.add(directionalLight);

  window.addEventListener('resize', onWindowResize);

  // flower
  generateFlower();

  // GLTF loader
  const loader = new GLTFLoader();

  loader.load('maskfinal/maskwithtextures.gltf', (gltf) => {
    mask = gltf.scene;
    scene.add(mask);
    mask.scale.set(28, 28, 28);
    mask.position.y = 4;
    mask.rotation.y = 90;
  });

  loader.load('animated_butterfly/scene.gltf', (gltf) => {
    butterfly = gltf.scene;
    scene.add(butterfly);

    butterfly.scale.set(5, 5, 5);
    butterfly.position.set(7, 25, 7);
    butterfly.rotation.y = 90;

    mixer = new THREE.AnimationMixer(butterfly);

    const clip = THREE.AnimationClip.findByName(gltf.animations, 'Flying');
    const action = mixer.clipAction(clip);
    action.play();
  });
}

// animation
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (mixer) mixer.update(clock.getDelta());

  const timer = Date.now() * 0.01;

  sphereGroup.rotation.y -= 0.002;

  smallSphere.position.set(
    Math.cos(timer * 0.1) * 30,
    Math.abs(Math.cos(timer * 0.2)) * 20 + 5,
    Math.sin(timer * 0.1) * 30
  );

  smallSphere.rotation.y = (Math.PI / 2) - timer * 0.1;
  smallSphere.rotation.z = timer * 0.8;

  // ✅ FIXED PETAL LOGIC (no inversion)
  for (let i = 0; i < petalCount; i++) {
    petalMeshes[i].rotation.set(0, 0, 0);

    petalMeshes[i].rotateY(rotationStep * i);

    // map mouseX [-1,1] → [0,1]
    const openness = THREE.MathUtils.clamp((mouseX + 1) / 2, 0, 1);

    const maxOpen = Math.PI / 2;
    petalMeshes[i].rotateX(openness * maxOpen);
  }

  renderer.render(scene, camera);
}

// resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  groundMirror.getRenderTarget().setSize(
    window.innerWidth * devicePixelRatio,
    window.innerHeight * devicePixelRatio
  );

  verticalMirror.getRenderTarget().setSize(
    window.innerWidth * devicePixelRatio,
    window.innerHeight * devicePixelRatio
  );
}

// flower
function generateFlower() {
  const petalMat = new THREE.MeshPhongMaterial({
    color: 0xb56e70,
    side: THREE.DoubleSide
  });

  const radius = 20;

  const petalGeom = new THREE.SphereGeometry(
    radius,
    20,
    20,
    Math.PI / 3,
    Math.PI / 3,
    0,
    Math.PI
  );

  petalGeom.translate(0, -radius, 0);
  petalGeom.rotateX(Math.PI / 2);

  petalMeshes = [];

  for (let i = 0; i < petalCount; i++) {
    petalMeshes[i] = new THREE.Mesh(petalGeom, petalMat);
    scene.add(petalMeshes[i]);
  }
}

// mouse
document.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}