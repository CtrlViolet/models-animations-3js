import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();

let camera, scene, renderer, stats, object, loader, guiMorphsFolder;
let mixer, actions = {}, currentAction = null, animationsFolder;

const timer = new THREE.Timer();
timer.connect(document);

const isGitHub = window.location.hostname.includes('github.io');

const BASE_PATH = isGitHub
    ? '/models-3js/assets/models/fbx/'
    : './assets/models/fbx/';

const animationNames = [
    'Flair on gas mask',
    'Shuffling on mask',
    'Kiss on the mask',
    'Sitting on the mask',
    'Cards on the mask'
];

const animationFiles = [
    'Flair.fbx',
    'Shuffling.fbx',
    'Kiss.fbx',
    'Sitting.fbx',
    'Cards.fbx'
];

let modelLoaded = false;
let animationsLoaded = 0;

init();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100;
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    // ground
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader(manager);

    // Load base model
loader.load(BASE_PATH + 'T-Pose.fbx', function (group) {
        object = group;
        scene.add(object);
        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        mixer = new THREE.AnimationMixer(object);
        modelLoaded = true;
        loadAnimations();
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);

    // stats
    stats = new Stats();
    container.appendChild(stats.dom);

    // Create Footer
    createFooter();

    guiMorphsFolder = new GUI().addFolder('Morphs').hide();
    animationsFolder = new GUI().addFolder('Animations').hide();
}

function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'footer-custom';
    footer.innerHTML = `
        <div class="container-fluid">
            <div class="footer-content">
                <div class="footer-section">
                    <h5>Developer</h5>
                    <p class="developer-name">Miguel Angel Vital Martinez</p>
                    <p class="developer-title">Full Stack Developer | Graphics & Web</p>
                </div>
                <div class="footer-section">
                    <h5>Contact</h5>
                    <p><a href="https://github.com/CtrlViolet" target="_blank" rel="noopener">GitHub: CtrlViolet</a></p>
                    <p style="font-size: 12px; color: #888;">Spain, 2026</p>
                </div>
                <div class="footer-section">
                    <h5>Technologies</h5>
                    <p style="font-size: 12px;">Three.js • WebGL • FBX • JavaScript ES6</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>Copyright 2026 - Miguel Angel Vital Martinez. All rights reserved.</p>
            </div>
        </div>
    `;
    document.body.appendChild(footer);
}


function loadAnimations() {
    animationFiles.forEach((file, index) => {
      loader.load(BASE_PATH + file, function (animGroup) {
            if (animGroup.animations && animGroup.animations.length > 0) {
                const clip = animGroup.animations[0];
                const action = mixer.clipAction(clip);
                actions[animationNames[index]] = action;
            }
            animationsLoaded++;
            if (animationsLoaded === animationFiles.length) {
                animationsFolder.show();
                animationsFolder.children.forEach((child) => child.destroy());
                animationNames.forEach((name) => {
                    animationsFolder.add({ [name]: () => switchAnimation(name) }, name);
                });
                switchAnimation(animationNames[0]);
            }
        });
    });
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function switchAnimation(clipName) {
    if (currentAction) {
        currentAction.fadeOut(0.25);
    }
    const action = actions[clipName];
    if (action) {
        action.reset().setEffectiveTimeScale(1).fadeIn(0.25).play();
        currentAction = action;
    }
}

function onKeyDown(event) {
    const key = parseInt(event.key);
    if (key >= 1 && key <= 5) {
        switchAnimation(animationNames[key - 1]);
    }
}

function animate() {

    timer.update();

    const delta = timer.getDelta();

    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);

    stats.update();

}