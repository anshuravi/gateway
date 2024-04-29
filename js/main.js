//~~~~~~~Import Three.js (also linked to as import map in HTML)~~~~~~
import * as THREE from 'three';

// Import add-ons
import { OrbitControls } from 'https://unpkg.com/three@0.162.0/examples/jsm/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// declare variables
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
  rotationStep = Math.PI * 2 / petalCount;



init();
animate();


function init() {
  const container = document.getElementById('container');

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // scene
  scene = new THREE.Scene();



  // camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(0, 75, 160);

  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 40, 0);
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 10;
  cameraControls.update();

  const planeGeo = new THREE.PlaneGeometry(100.1, 100.1);

  // reflectors/mirrors

  let geometry, material;

  geometry = new THREE.CircleGeometry(40, 64);
  groundMirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0xb5b5b5
  });
  groundMirror.position.y = 0.5;
  groundMirror.rotateX(- Math.PI / 2);
  scene.add(groundMirror);

  geometry = new THREE.PlaneGeometry(100, 100);
  verticalMirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0xc1cbcb
  });
  verticalMirror.position.y = 50;
  verticalMirror.position.z = - 50;
  scene.add(verticalMirror);

  sphereGroup = new THREE.Object3D();
  scene.add(sphereGroup);

  geometry = new THREE.CylinderGeometry(0.1, 15 * Math.cos(Math.PI / 180 * 30), 0.1, 24, 1);
  material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x8d8d8d });
  const sphereCap = new THREE.Mesh(geometry, material);
  sphereCap.position.y = - 15 * Math.sin(Math.PI / 180 * 30) - 0.05;
  sphereCap.rotateX(- Math.PI);
  // dice construction 
  geometry = new THREE.IcosahedronGeometry(4, 0);
  material = new THREE.MeshPhongMaterial({ color:  0xC4B454, emissive: 0x05445E, flatShading: true });
  smallSphere = new THREE.Mesh(geometry, material);
  scene.add(smallSphere);
  //doors and vine planes 
  const doorTexture = new THREE.TextureLoader().load('door3.png');
  const planeFront = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ map: doorTexture }));
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  scene.add(planeFront);

  const vineTexture = new THREE.TextureLoader().load('plants.png');
  const planeRight = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ map: vineTexture }));
  planeRight.position.x = 50;
  planeRight.position.y = 50;
  planeRight.rotateY(- Math.PI / 2);
  scene.add(planeRight);

  const vine2Texture = new THREE.TextureLoader().load('plants.png');
  const planeLeft = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ map: vine2Texture }));
  planeLeft.position.x = - 50;
  planeLeft.position.y = 50;
  planeLeft.rotateY(Math.PI / 2);
  scene.add(planeLeft);

  //lights 
  var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1); //ambient
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 4); //directional
  directionalLight.position.y = 2;
  scene.add(directionalLight);

  window.addEventListener('resize', onWindowResize);
  // flower
  generateFlower();

  // Load GLTF model
  const loader = new GLTFLoader();
  // Load mask model
  loader.load('maskfinal/maskwithtextures.gltf', function (gltf) {
    mask = gltf.scene;
    scene.add(mask);
    mask.scale.set(28, 28, 28); 
    mask.position.y = 4; 
    mask.rotation.y = 90;
  });
  // load butterfly model
  loader.load('animated_butterfly/scene.gltf', function (gltf) {
    butterfly = gltf.scene;
    scene.add(butterfly);
    butterfly.scale.set(5, 5, 5); 
    butterfly.position.y = 25;
    butterfly.position.z = 7;
    butterfly.position.x = 7;
    //  //butterfly.rotation.x = 90;
    butterfly.rotation.y = 90;
    mixer = new THREE.AnimationMixer(butterfly)
    const clips = gltf.animations;
    const clip = THREE.AnimationClip.findByName(clips, 'Flying');
    const action = mixer.clipAction(clip);
    action.play();

  });

}


//animations
const clock = new THREE.Clock();
function animate() {
  if (mixer)
    mixer.update(clock.getDelta());
  renderer.render(scene, camera);

  requestAnimationFrame(animate);


  const timer = Date.now() * 0.01;

  sphereGroup.rotation.y -= 0.002;

  smallSphere.position.set(
    Math.cos(timer * 0.1) * 30,
    Math.abs(Math.cos(timer * 0.2)) * 20 + 5,
    Math.sin(timer * 0.1) * 30
  );
  smallSphere.rotation.y = (Math.PI / 2) - timer * 0.1;
  smallSphere.rotation.z = timer * 0.8;

  for (var i = 0; i < petalCount; i++) {
    petalMeshes[i].rotation.set(0, 0, 0);
    petalMeshes[i].rotateY(rotationStep * i);
    petalMeshes[i].rotateX((Math.PI / 2) * Math.abs(mouseX));
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  groundMirror.getRenderTarget().setSize(
    window.innerWidth * window.devicePixelRatio,
    window.innerHeight * window.devicePixelRatio
  );
  verticalMirror.getRenderTarget().setSize(
    window.innerWidth * window.devicePixelRatio,
    window.innerHeight * window.devicePixelRatio
  );
}
//flower creation
function generateFlower() {
  let petalMat = new THREE.MeshPhongMaterial({ color: 0xb56e70, side: THREE.DoubleSide });

  let radius = 20;

  let petalGeom = new THREE.SphereGeometry(radius, 20, 20, Math.PI / 3, Math.PI / 3, 0, Math.PI);
  petalGeom.translate(0, -radius, 0);
  petalGeom.rotateX(Math.PI / 2);

  let petalMesh = new THREE.Mesh(petalGeom, petalMat);

  petalMeshes = [];

  for (let i = 0; i < petalCount; i++) {
    petalMeshes[i] = petalMesh.clone();
    scene.add(petalMeshes[i]);
  }
}

document.addEventListener("mousemove", onMouseMove, false);

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}


