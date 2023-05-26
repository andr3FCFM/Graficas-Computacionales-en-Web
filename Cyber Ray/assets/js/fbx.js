import * as THREE2 from "/assets/js/three.module.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js";







let fbxConstruction;
var modelConstruction1;

function loadConstruction1() {
    const loader = new FBXLoader();
    loader.setPath("../assets/FBXmodels/");
    loader.load("Hex.fbx", (loadedfbx1) => {
        fbxConstruction = loadedfbx1;
        fbxConstruction.scale.setScalar(0.1);
        fbxConstruction.traverse((c) => {
            c.castShadow = true;
        });
        fbxConstruction.position.copy(new THREE.Vector3(0, 0, 0));

        // Crear la caja de colisión para el modelo animado
        modelConstruction1 = new THREE.Box3().setFromObject(fbxConstruction);

        /*const animLoader = new FBXLoader();
        animLoader.setPath("../assets/FBXmodels/");
        animLoader.load("Hex.fbx", (anim) => {
            const mixer = new THREE.AnimationMixer(fbxConstruction);
            animationMixer.push(mixer);
            const idleAction = mixer.clipAction(anim.animations[0]);
            idleAction.play();

            checkCollisions();
            animate();
        });*/

        scene.add(fbxConstruction);

        //checkCollisions();
    });
}

loadConstruction1();