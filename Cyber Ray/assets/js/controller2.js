//modulos para THREE JS
import * as THREE2 from "/assets/js/three.module.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
import { OrbitControls } from "/assets/js/OrbitControls.js";
import { GLTFLoader } from "/assets/js/GLTFLoader.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "/assets/js/OBJLoader.js";
import { MTLLoader } from "/assets/js/MTLLoader.js";

//modulos para multiplayer
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js"; //obligatorio, pone el firebase en marcha
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcPOGxMUJvwLWx_debKErU1774YvicotE",
  authDomain: "coordenadas-6912f.firebaseapp.com",
  databaseURL: "https://coordenadas-6912f-default-rtdb.firebaseio.com",
  projectId: "coordenadas-6912f",
  storageBucket: "coordenadas-6912f.appspot.com",
  messagingSenderId: "729364270537",
  appId: "1:729364270537:web:b55da823b41ab85ad16c18",
};

var hizoLogin = false;
var rotacionJugador = new THREE.Vector3(0, 0, 0);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
auth.languageCode = "es";
const provider = new GoogleAuthProvider();
const db = getDatabase();
let currentUser;

async function login() {
  const res = await signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      currentUser = user;
      console.log(user);
      writeUserData(user.uid, { x: 0, z: 0 });
      hizoLogin = true;
      // IdP data available using getAdditionalUserInfo(result)
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
    });
}

const buttonLogin = document.getElementById("button-login");
const buttonLogout = document.getElementById("button-logout");

//variables para que pueda rotarse la nave
var planePlayer = new THREE.Plane(new THREE.Vector3(0, 1, 0)); //plano en el que se va a rotar
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var pointOfIntersection = new THREE.Vector3();
window.addEventListener("mousemove", onMouseMove, false);

buttonLogin.addEventListener("click", async () => {
  const user = await login();
});

buttonLogout.addEventListener("click", async () => {
  console.log(currentUser.uid);
  deleteUser(currentUser.uid);
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      console.log("Sign-out successful.");
    })
    .catch((error) => {
      // An error happened.
      console.log("An error happened");
    });
});

function writeUserData(userId, position) {
  set(ref(db, "jugador/" + userId), {
    x: position.x,
    z: position.z,
    playerRotation: rotacionJugador,
    //puntoInterseccion: pointOfIntersection
  });
}

function deleteUser(userId) {
  set(ref(db, "jugador/" + userId), {
    x: null,
    z: null,
  });
  location.reload();
}

//var boxCollisionPlayer;
var jugadorNames = {};  //El nombre del jugador --> Key

const starCountRef = ref(db, "jugador/");
onValue(starCountRef, (snapshot) => {
  //ONVALUE se ejecuta cada vez que cambia la base de datos
  const data = snapshot.val();
  Object.entries(data).forEach(([key, value]) => {
    //por cada entidad
    const jugador = scene.getObjectByName(key); //lo obtendremos de la clave j1 o j2, si no existe entonces lo agregamos a la escena
    if (!jugador) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.position.set(value.x, 0, value.z);
      mesh.material.color = new THREE.Color(Math.random() * 0xffffff);
      mesh.name = key;

      const jugadorInfo = {name: key};
      jugadorNames[key] = jugadorInfo;
      //Creamos la caja de colisión
      //boxCollisionPlayer = new THREE.Box3().setFromObject(mesh);


      scene.add(mesh);
    }
    scene.getObjectByName(key).position.x = value.x;
    scene.getObjectByName(key).position.z = value.z;
    scene.getObjectByName(key).rotation.x = value.playerRotation.x;
    scene.getObjectByName(key).rotation.y = value.playerRotation.y;
    scene.getObjectByName(key).rotation.z = value.playerRotation.z;

    //console.log(key);
    //console.log(value);
  });
  //console.log(data);
});

//SCENE
const scene = new THREE.Scene(); //Crea la escena
scene.background = new THREE.Color("#34495E"); //Color de fondo

const camera = new THREE.PerspectiveCamera( //cámara
  30, //zoom
  window.innerWidth / window.innerHeight
);
camera.position.set(0, 40, 30); //que tan lejos está la camara

// RENDER
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

//Light
const hemispherelight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
//scene.add(hemispherelight);

const directionallight = new THREE.DirectionalLight(0xffffff, 1);
directionallight.position.set(10, 10, -1);
directionallight.castShadow = true; //habilitamos que puedan generar sombras

//plano
const planeGeometry = new THREE.PlaneGeometry(50, 50);
const planeMaterial = new THREE.MeshStandardMaterial({ color: "slategrey" });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, -0.5, 0); //mueve el plano un poco más abajo
plane.rotateX(-Math.PI / 2); //lo rota en x
plane.receiveShadow = true; //puede recibir sombras

document.onkeydown = function (e) {
  const jugadorActual = scene.getObjectByName(currentUser.uid);

  if (e.keyCode == 37 || e.keyCode == 65) {
    //D
    jugadorActual.position.x -= 1;
  }

  if (e.keyCode == 39 || e.keyCode == 68) {
    //A
    jugadorActual.position.x += 1;
  }

  if (e.keyCode == 38 || e.keyCode == 87) {
    //W
    jugadorActual.position.z -= 1;
  }

  if (e.keyCode == 40 || e.keyCode == 83) {
    //S
    jugadorActual.position.z += 1;
  }

  writeUserData(currentUser.uid, jugadorActual.position);
  checkBuildingsCollisions();
};

let animationMixer = [];

const clock = new THREE.Clock();
// geometry
const geometry = new THREE.BufferGeometry();

// attributes
const vertices = new Float32Array([0.0, -1.0, 0.0, 10.0, -1.0, 0.0]); // 3 vertices per point
geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

// material
const material = new THREE.LineBasicMaterial({ color: 0x00008b });

// line
var lineaDisparo = new THREE.Line(geometry, material);
lineaDisparo.name = "lineaDisparo";
scene.add(lineaDisparo);

//adding to the scene
scene.add(plane, hemispherelight, directionallight);

//movimiento

const cameraControl = new OrbitControls(camera, renderer.domElement);

//control seguir el mouse

function onMouseMove(event) {
  if (hizoLogin) {
    const jugadorActual = scene.getObjectByName(currentUser.uid);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(planePlayer, pointOfIntersection);
    jugadorActual.lookAt(pointOfIntersection); //tiene X/Y/Z, osea Vector3

    //si se le quita el new no detecta el formato adecuado
    rotacionJugador = new THREE.Vector3(
      jugadorActual.rotation.x,
      jugadorActual.rotation.y,
      jugadorActual.rotation.z
    ); //pasa la rotación actual
    writeUserData(currentUser.uid, jugadorActual.position);
  }
}

//

//ajustar pantalla
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.render(scene, camera);
}

window.addEventListener("resize", resize);

/*const loaderGLTF = new GLTFLoader();
      loaderGLTF.load("assets/GLTFmodels/scene.gltf",
          function(gltf) {
              //console.log(gltg);
              const obj = gltf.scene;
              scene.add(obj);
          }
      );*/

const Bote = new GLTFLoader();
Bote.load("assets/GLTFmodels/Bote.gltf", function (gltf_1) {
  //console.log(gltg);
  const botesito = gltf_1.scene;
  scene.add(botesito);
});

/*const Hex = new GLTFLoader();
      Hex.load("assets/GLTFmodels/Hex.gltf",
          function(gltf_Hex) {
              //console.log(gltg);
              const Hexa = gltf_Hex.scene;
              scene.add(Hexa);
          }
      );*/

const E7 = new GLTFLoader();
E7.load("assets/GLTFmodels/Edificio_7.gltf", function (gltf_e7) {
  //console.log(gltg);
  const Edi7 = gltf_e7.scene;
  scene.add(Edi7);
});

const E10 = new GLTFLoader();
E10.load("assets/GLTFmodels/Edificio_10.gltf", function (gltf_e10) {
  //console.log(gltg);
  const Edi10 = gltf_e10.scene;
  scene.add(Edi10);
});

const E11 = new GLTFLoader();
E11.load("assets/GLTFmodels/Edificio_11.gltf", function (gltf_e11) {
  //console.log(gltg);
  const Edi11 = gltf_e11.scene;
  scene.add(Edi11);
});

/*const TC = new GLTFLoader();
      TC.load("assets/GLTFmodels/Torre_Central.gltf",
          function(gltf_TC) {
              //console.log(gltg);
              const EdiTC = gltf_TC.scene;
              scene.add(EdiTC);
          }
      );*/

const CyPu = new GLTFLoader();
CyPu.load("assets/GLTFmodels/CyPu_Assets.gltf", function (gltf_CyPu) {
  //console.log(gltg);
  const EdiCyPu = gltf_CyPu.scene;
  scene.add(EdiCyPu);
});

/*const Suelo = new GLTFLoader();
      Suelo.load("assets/GLTFmodels/Suelo.gltf",
          function(gltf_Suelo) {
              //console.log(gltg);
              const EdiSuelo = gltf_Suelo.scene;
              scene.add(EdiSuelo);
          }
      );*/

const Box = new GLTFLoader();
Box.load("assets/GLTFmodels/Box.gltf", function (gltf_Box) {
  //console.log(gltg);
  const EdiBox = gltf_Box.scene;
  scene.add(EdiBox);
});
//"assets/OBJmodels/diffuse.png"
/* const loaderOBJ = new OBJLoader();
      loaderOBJ.load("assets/OBJmodels/airplane.obj", function(model){
            const meshModel = new THREE.Mesh(
                model,
                new THREE.MeshPhongMaterial({color:"red"})
            );
            //meshModel.scale.set(1,0.03,0.03);
            //meshModel.position.set(-6, 0, 0);
            //meshModel.rotateX(-Math.PI/2);
            //scene.add(meshModel);
      }); */

//carga con el MTL y el OBJ
/*       var mtlLoader = new MTLLoader();
            mtlLoader.load("assets/OBJmodels/airplane.mtl", function(materials){
              materials.preload();

              var objLoader = new OBJLoader();
              objLoader.load("assets/OBJmodels/airplane.obj", function(object){
                  object.position.x= 20;
                  scene.add(object);
              });

            }); */

//animar
// ****************************************FBX*************************************************
var Test;
let fbx;

//function loadAnimatedModelAndPlay() {
/* const loader = new FBXLoader();
       loader.setPath("assets/FBXmodels/");
       loader.load("Hex.fbx", (loadedfbx) => {
           fbx = loadedfbx;
           fbx.scale.setScalar(0.1);
           fbx.traverse((c) => {
               c.castShadow = true;
           });
           fbx.position.copy(new THREE.Vector3(-57, 0, 0));

           // Crear la caja de colisión para el modelo animado
           /*Test = new THREE.BoxGeometry().setFromObject(fbx);

           const animLoader = new FBXLoader();
           animLoader.setPath("assets/FBXmodels/");
           animLoader.load("Hex.fbx", (anim) => {
               const mixer = new THREE.AnimationMixer(fbx);
               animationMixer.push(mixer);
               const idleAction = mixer.clipAction(anim.animations[0]);
               idleAction.play();*/

//checkCollisions();
//animate();
//});

// scene.add(fbx);
// cityScene.add(fbx);
// ****************************************FBX*************************************************

//checkCollisions();
//  });
//      }

let fbxConstruction;
var modelConstruction1; //Caja de colisión del modelo

function loadConstruction1() {
  const loader = new FBXLoader();
  loader.setPath("./assets/FBXmodels/");
  loader.load("Character1.fbx", (loadedfbx1) => {
    fbxConstruction = loadedfbx1;
    fbxConstruction.scale.setScalar(0.1);
    fbxConstruction.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction.position.copy(new THREE.Vector3(10, 0, -10));

    // Crear la caja de colisión para el modelo animado
    modelConstruction1 = new THREE.Box3().setFromObject(fbxConstruction);

    const animLoader = new FBXLoader();
    animLoader.setPath("./assets/FBXmodels/");
    animLoader.load("Character1.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      //checkCollisions();
      animate();
    });

    scene.add(fbxConstruction);

    //checkCollisions();
  });
}

//Carga de modelos
loadConstruction1();

let jugadoresColisionados = 0;

function checkBuildingsCollisions() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = scene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction1 && jugadorBB.intersectsBox(modelConstruction1)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(
            fbxConstruction.position
          );
          const retroceso = jugadorPosition
            .sub(construccionPosition)
            .normalize()
            .multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function animate() {
  const deltaTime = clock.getDelta();
  //cube2BB.copy(cube2.geometry.boundingBox).applyMatrix4(cube2.matrixWorld); //Copia la geometría con el matrix4.

  //checkCollissions();

  const linea = scene.getObjectByName("lineaDisparo");

  for (let i = 0; i < animationMixer.length; i++) {
    animationMixer[i].update(deltaTime);
  }

  //loadConstruction1();
  trayectoria();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function trayectoria() {
  if (hizoLogin) {
    // Draw a line from pointA in the given direction at distance 100
    const jugadorActual = scene.getObjectByName(currentUser.uid);
    const linea = scene.getObjectByName("lineaDisparo");
    var pointA = new Float32Array(jugadorActual.position);
    var direction = new Float32Array(pointOfIntersection);

    linea.geometry.attributes.position.array[0] = pointA[0];
    linea.geometry.attributes.position.array[1] = pointA[1];
    linea.geometry.attributes.position.array[2] = pointA[2];
    linea.geometry.attributes.position.array[3] = direction[0];
    linea.geometry.attributes.position.array[4] = direction[1];
    linea.geometry.attributes.position.array[5] = direction[2];

    //console.log(linea.geometry.attributes.position.array);

    linea.geometry.attributes.position.needsUpdate = true; // required after the first render
  }
}
animate();
//loadAnimatedModelAndPlay();
