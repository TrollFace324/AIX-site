/**
 * Переключение 2D/3D в блоке робота.
 * 2D: показывает robot-new.png
 * 3D: лениво инициализирует Three.js и загружает GLB только по клику.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const VIEWER_SETTINGS = {
    // Начальная позиция камеры до автоподгонки модели.
    cameraInitialPosition: { x: 2, y: 1.5, z: 2 },
    // Сила демпфирования OrbitControls (больше => быстрее затухает движение).
    cameraDampingFactor: 0.2,
    // Множитель стартовой дистанции камеры после автоподгонки.
    startZoomFactor: 1.2,
    // Минимально возможная дистанция зума.
    minZoomDistance: 0.4,
    // Максимально возможная дистанция зума.
    maxZoomDistance: 80,
    // Ограничение FPS в цикле рендера.
    renderFps: 60,
    // Шаг сдвига обзора при одном нажатии стрелок.
    panStepPerPress: 0.25,
    // Шаг сдвига обзора на один тик при удержании стрелок.
    panStepPerHoldTick: 0.5,
    // Интервал (мс) между тиками сдвига при удержании.
    panHoldRepeatMs: 40,
    // Максимальный радиус смещения target от центра модели.
    maxPanDistanceFromCenter: 100,
    // Угол поворота модели при одном нажатии кнопки поворота.
    modelRotateStepPerPress: 0.12,
    // Угол поворота модели на один тик при удержании кнопки.
    modelRotateStepPerHoldTick: 0.08,
    // Интервал (мс) между тиками поворота при удержании.
    modelRotateHoldRepeatMs: 40,
    // Ось поворота модели: 'x' или 'y'.
    modelRotateAxis: 'x',
    // Нижний коэффициент дистанции зума после fitCameraToObject.
    fitMinZoomFactor: 0.12,
    // Верхний коэффициент дистанции зума после fitCameraToObject.
    fitMaxZoomFactor: 16
};

(function () {
    const container = document.getElementById('robot-viewer');
    const image2d = document.getElementById('robot-image-2d');
    const modeToggle = document.getElementById('robot-mode-toggle');
    if (!container || !image2d || !modeToggle) return;

    let viewerReady = false;
    let viewerInitStarted = false;
    let currentMode = '2d';

    const state = {
        modelRoot: null,
        modelCenter: new THREE.Vector3(0, 0, 0),
        worldAxisX: new THREE.Vector3(1, 0, 0),
        worldAxisY: new THREE.Vector3(0, 1, 0),
        camera: null,
        controls: null,
        renderer: null,
        zoomLabel: null,
        positionLabel: null,
        statusLabel: null,
        lastRenderTime: 0,
        frameDurationMs: 1000 / Math.max(1, VIEWER_SETTINGS.renderFps)
    };

    function show2D() {
        currentMode = '2d';
        image2d.classList.remove('is-hidden');
        container.classList.add('is-hidden');
        modeToggle.textContent = '3D';
        modeToggle.disabled = false;
    }

    function show3D() {
        currentMode = '3d';
        image2d.classList.add('is-hidden');
        container.classList.remove('is-hidden');
        modeToggle.textContent = '2D';
        modeToggle.disabled = false;
    }

    function setLoadingButton() {
        modeToggle.textContent = '...';
        modeToggle.disabled = true;
    }

    function setStatusMessage(text, isError) {
        if (!state.statusLabel) return;
        state.statusLabel.textContent = text;
        state.statusLabel.classList.toggle('is-error', Boolean(isError));
    }

    function hideStatusMessage() {
        if (!state.statusLabel) return;
        state.statusLabel.remove();
        state.statusLabel = null;
    }

    function clampPanAroundModelCenter() {
        if (!state.modelRoot || !state.controls || !state.camera) return;
        const maxPanDistance = VIEWER_SETTINGS.maxPanDistanceFromCenter;
        if (maxPanDistance <= 0) return;

        const offsetFromCenter = new THREE.Vector3().subVectors(state.controls.target, state.modelCenter);
        if (offsetFromCenter.length() <= maxPanDistance) return;

        const cameraToTarget = new THREE.Vector3().subVectors(state.camera.position, state.controls.target);
        offsetFromCenter.setLength(maxPanDistance);
        state.controls.target.copy(state.modelCenter).add(offsetFromCenter);
        state.camera.position.copy(state.controls.target).add(cameraToTarget);
    }

    function updatePositionLabel() {
        if (!state.positionLabel || !state.camera) return;
        state.positionLabel.textContent =
            'XYZ: ' +
            state.camera.position.x.toFixed(2) + ', ' +
            state.camera.position.y.toFixed(2) + ', ' +
            state.camera.position.z.toFixed(2);
    }

    function updateZoomLabel() {
        if (!state.zoomLabel || !state.camera || !state.controls) return;
        const zoom = state.camera.position.distanceTo(state.controls.target);
        state.zoomLabel.textContent = 'Zoom: ' + zoom.toFixed(2);
    }

    function fitCameraToObject(object3D) {
        if (!state.camera || !state.controls) return;
        const box = new THREE.Box3().setFromObject(object3D);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maxDim) || maxDim <= 0) return;

        const fitHeightDistance = maxDim / (2 * Math.tan((Math.PI * state.camera.fov) / 360));
        const fitWidthDistance = fitHeightDistance / state.camera.aspect;
        const distance = VIEWER_SETTINGS.startZoomFactor * Math.max(fitHeightDistance, fitWidthDistance);

        const direction = new THREE.Vector3(1, 0.6, 1).normalize();
        state.camera.position.copy(center).addScaledVector(direction, distance);
        state.camera.near = Math.max(0.01, distance / 100);
        state.camera.far = distance * 100;
        state.camera.updateProjectionMatrix();

        state.controls.minDistance = Math.max(distance * VIEWER_SETTINGS.fitMinZoomFactor, VIEWER_SETTINGS.minZoomDistance);
        state.controls.maxDistance = Math.max(distance * VIEWER_SETTINGS.fitMaxZoomFactor, VIEWER_SETTINGS.maxZoomDistance);
        state.modelCenter.copy(center);
        state.controls.target.copy(center);
        state.controls.update();
        updatePositionLabel();
        updateZoomLabel();
    }

    function bindHoldAction(button, onPress, onHold, intervalMs) {
        if (!button) return;
        let holdIntervalId = null;
        let isHolding = false;

        function stopHold() {
            if (holdIntervalId) {
                clearInterval(holdIntervalId);
                holdIntervalId = null;
            }
            isHolding = false;
        }

        button.addEventListener('pointerdown', function (event) {
            event.preventDefault();
            stopHold();
            isHolding = true;
            onPress();
            holdIntervalId = setInterval(function () {
                if (!isHolding) return;
                onHold();
            }, intervalMs);
        });

        button.addEventListener('pointerup', stopHold);
        button.addEventListener('pointercancel', stopHold);
        button.addEventListener('pointerleave', stopHold);
        window.addEventListener('blur', stopHold);
    }

    function createNavigationControls() {
        const nav = document.createElement('div');
        nav.className = 'robot-viewer-nav';
        nav.innerHTML = [
            '<button type="button" class="robot-viewer-nav-btn robot-viewer-nav-rotate-left" aria-label="Повернуть модель против часовой стрелки">⟲</button>',
            '<button type="button" class="robot-viewer-nav-btn robot-viewer-nav-rotate-right" aria-label="Повернуть модель по часовой стрелке">⟳</button>',
            '<button type="button" class="robot-viewer-nav-btn robot-viewer-nav-up" aria-label="Сместить обзор вверх">↑</button>',
            '<button type="button" class="robot-viewer-nav-btn robot-viewer-nav-left" aria-label="Сместить обзор влево">←</button>',
            '<button type="button" class="robot-viewer-nav-btn robot-viewer-nav-right" aria-label="Сместить обзор вправо">→</button>',
            '<button type="button" class="robot-viewer-nav-btn robot-viewer-nav-down" aria-label="Сместить обзор вниз">↓</button>'
        ].join('');
        container.appendChild(nav);

        const moveView = function (dx, dy) {
            if (!state.camera || !state.controls) return;
            const forward = new THREE.Vector3();
            state.camera.getWorldDirection(forward);
            const right = new THREE.Vector3().crossVectors(forward, state.camera.up).normalize();
            const up = new THREE.Vector3().copy(state.camera.up).normalize();
            const move = new THREE.Vector3().addScaledVector(right, dx).addScaledVector(up, dy);
            state.camera.position.add(move);
            state.controls.target.add(move);
            clampPanAroundModelCenter();
            state.controls.update();
        };

        const rotateModel = function (stepAngle, direction) {
            if (!state.modelRoot) return;
            const axis = VIEWER_SETTINGS.modelRotateAxis === 'x' ? state.worldAxisX : state.worldAxisY;
            const signedAngle = direction === 'counterclockwise' ? stepAngle : -stepAngle;
            state.modelRoot.rotateOnWorldAxis(axis, signedAngle);
        };

        bindHoldAction(
            nav.querySelector('.robot-viewer-nav-up'),
            function () { moveView(0, VIEWER_SETTINGS.panStepPerPress); },
            function () { moveView(0, VIEWER_SETTINGS.panStepPerHoldTick); },
            VIEWER_SETTINGS.panHoldRepeatMs
        );
        bindHoldAction(
            nav.querySelector('.robot-viewer-nav-down'),
            function () { moveView(0, -VIEWER_SETTINGS.panStepPerPress); },
            function () { moveView(0, -VIEWER_SETTINGS.panStepPerHoldTick); },
            VIEWER_SETTINGS.panHoldRepeatMs
        );
        bindHoldAction(
            nav.querySelector('.robot-viewer-nav-left'),
            function () { moveView(-VIEWER_SETTINGS.panStepPerPress, 0); },
            function () { moveView(-VIEWER_SETTINGS.panStepPerHoldTick, 0); },
            VIEWER_SETTINGS.panHoldRepeatMs
        );
        bindHoldAction(
            nav.querySelector('.robot-viewer-nav-right'),
            function () { moveView(VIEWER_SETTINGS.panStepPerPress, 0); },
            function () { moveView(VIEWER_SETTINGS.panStepPerHoldTick, 0); },
            VIEWER_SETTINGS.panHoldRepeatMs
        );
        bindHoldAction(
            nav.querySelector('.robot-viewer-nav-rotate-left'),
            function () { rotateModel(VIEWER_SETTINGS.modelRotateStepPerPress, 'counterclockwise'); },
            function () { rotateModel(VIEWER_SETTINGS.modelRotateStepPerHoldTick, 'counterclockwise'); },
            VIEWER_SETTINGS.modelRotateHoldRepeatMs
        );
        bindHoldAction(
            nav.querySelector('.robot-viewer-nav-rotate-right'),
            function () { rotateModel(VIEWER_SETTINGS.modelRotateStepPerPress, 'clockwise'); },
            function () { rotateModel(VIEWER_SETTINGS.modelRotateStepPerHoldTick, 'clockwise'); },
            VIEWER_SETTINGS.modelRotateHoldRepeatMs
        );
    }

    function onResize() {
        if (!state.camera || !state.renderer) return;
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        state.camera.aspect = width / height;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(width, height, false);
    }

    function startRenderLoop() {
        function animate(now) {
            requestAnimationFrame(animate);
            if (now - state.lastRenderTime < state.frameDurationMs) return;
            state.lastRenderTime = now;
            state.controls.update();
            clampPanAroundModelCenter();
            updatePositionLabel();
            updateZoomLabel();
            state.renderer.render(state.scene, state.camera);
        }
        animate(0);
    }

    function loadModel(loader, modelPath) {
        return new Promise(function (resolve, reject) {
            loader.load(modelPath, resolve, undefined, reject);
        });
    }

    async function initViewerOnce() {
        if (viewerReady || viewerInitStarted) return;
        viewerInitStarted = true;

        if (window.location.protocol === 'file:') {
            viewerInitStarted = false;
            throw new Error('Run via local server');
        }

        state.statusLabel = document.createElement('div');
        state.statusLabel.className = 'robot-viewer-status';
        state.statusLabel.textContent = 'Загрузка 3D модели...';
        container.appendChild(state.statusLabel);

        state.scene = new THREE.Scene();
        state.scene.background = new THREE.Color(0xf5f4f8);
        state.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        state.camera.position.set(
            VIEWER_SETTINGS.cameraInitialPosition.x,
            VIEWER_SETTINGS.cameraInitialPosition.y,
            VIEWER_SETTINGS.cameraInitialPosition.z
        );

        state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        state.renderer.outputColorSpace = THREE.SRGBColorSpace;
        state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        state.renderer.toneMappingExposure = 1;
        container.appendChild(state.renderer.domElement);

        state.controls = new OrbitControls(state.camera, state.renderer.domElement);
        state.controls.enableDamping = true;
        state.controls.dampingFactor = VIEWER_SETTINGS.cameraDampingFactor;
        state.controls.minDistance = VIEWER_SETTINGS.minZoomDistance;
        state.controls.maxDistance = VIEWER_SETTINGS.maxZoomDistance;
        state.controls.target.set(0, 0.3, 0);

        state.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        keyLight.position.set(4, 5, 3);
        state.scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
        fillLight.position.set(-3, 2, -2);
        state.scene.add(fillLight);

        state.zoomLabel = document.createElement('div');
        state.zoomLabel.className = 'robot-viewer-zoom';
        container.appendChild(state.zoomLabel);
        state.positionLabel = document.createElement('div');
        state.positionLabel.className = 'robot-viewer-initial-pos';
        container.appendChild(state.positionLabel);

        createNavigationControls();
        onResize();
        window.addEventListener('resize', onResize);

        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/');
        loader.setDRACOLoader(dracoLoader);

        try {
            const gltf = await loadModel(loader, '3d-models/robot.glb');
            state.modelRoot = gltf.scene;
            state.scene.add(state.modelRoot);
            fitCameraToObject(state.modelRoot);
            hideStatusMessage();
            viewerReady = true;
            startRenderLoop();
        } catch (error) {
            console.warn('Robot 3D model load error:', error);
            setStatusMessage('Не удалось загрузить 3D модель: 3d-models/robot.glb', true);
            viewerInitStarted = false;
            throw error;
        }
    }

    modeToggle.addEventListener('click', async function () {
        if (currentMode === '3d') {
            show2D();
            return;
        }

        if (viewerReady) {
            show3D();
            onResize();
            return;
        }

        setLoadingButton();
        show3D();
        try {
            await initViewerOnce();
            onResize();
        } catch (error) {
            console.warn('3D switch error:', error);
            show2D();
        }
    });

    show2D();
})();
