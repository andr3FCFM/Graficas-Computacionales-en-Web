import * as THREE1 from "./three.module.js"; //Epoca Picapiedra
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js"; //Este el nuevo

import { OrbitControls } from "./OrbitControls.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js";

import { CircleGeometry } from "../three.module.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.0/firebase-app.js"; // AQUI PUEDE IR LA 9.19.1
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.19.0/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {
  getDatabase,
  ref,
  onValue,
  set,
} from "https://www.gstatic.com/firebasejs/9.19.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAD00YWnfCKIg_taz8Qsd3S5vKZDhObImE",
  authDomain: "coordenadas-cf28f.firebaseapp.com",
  databaseURL: "https://coordenadas-cf28f-default-rtdb.firebaseio.com",
  projectId: "coordenadas-cf28f",
  storageBucket: "coordenadas-cf28f.appspot.com",
  messagingSenderId: "638534802606",
  appId: "1:638534802606:web:faa80ee102ba93cbe9213f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(); //LE QUITO EL PARAMETRO APP PORQUE SE BASÓ PARA LO DE REGISTRAR USUARIOS
//const auth = getAuth();
auth.languageCode = "es";
const provider = new GoogleAuthProvider();

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(); //EL PROFE NO TIENE EL PARAMETRO APP
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
      const rotY = 0;
      writeUserData(user.uid, { x: 0, z: 0 }, rotY); //ponermos la rotacion
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
      console.log(errorMessage);
      // ...
    });
}

const buttonLogin = document.getElementById("button-login");
const buttonLogout = document.getElementById("button-logout");

buttonLogin.addEventListener("click", async () => {
  const user = await login();
});

buttonLogout.addEventListener("click", async () => {
  const auth = getAuth(); //ESTA LINEA NO LA COPIO EL PROFE
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      alert("Sign-out successful.");
      console.log("Sign-out successful.");
    })
    .catch((error) => {
      // An error happened.
      alert("An error happened");
      console.log("An error happened");
    });
});

//creamos la escena
const cityScene = new THREE.Scene();
cityScene.background = new THREE.Color("#8E3CB8");

//creamos la camara
const fov = 90;
const aspect = 1920 / 1080;
const near = 1.0;
const far = 1000.0;
let cameraInitialized = false;

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
//camera.position.set(25, 10, 25);
//camera.lookAt(0,0,0);

/*const camera = new THREE.PerspectiveCamera(
   60,
   window.innerWidth / window.innerHeight
 );*/
//camera.position.set(0, 0, 20);   ELIUD

const cameraHeight = 50; // Altura de la cámara sobre el jugador
const cameraDistance = 20; // Distancia de la cámara respecto al jugador

const terrainTextureLoader = new THREE.TextureLoader();
const terrainTexture = terrainTextureLoader.load("../images/concrete.jpg");
const terrainPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400, 10, 10),
  new THREE.MeshStandardMaterial({
    map: terrainTexture, //la textura del concreto
    side: THREE.DoubleSide,
    color: 0x2f2f2f, //cambio de color del plano
  })
);
terrainPlane.castShadow = false;
terrainPlane.receiveShadow = true;
terrainPlane.rotation.x = -Math.PI / 2;
cityScene.add(terrainPlane);

// Creamos el renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
/*controls.enableDamping = true
controls.target.set(0, 1, 0)*/

// const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
// // hemiLight.position.set(0, 20, 0);
// cityScene.add(hemiLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
// directionalLight.position.set(1, 5, -1);
// directionalLight.castShadow = true;             ELIUD

//creamos una luz direccional
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(-100, 100, 100);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.001;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 700.0;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 700.0;
directionalLight.shadow.camera.left = 300;
directionalLight.shadow.camera.right = -300;
directionalLight.shadow.camera.top = 300;
directionalLight.shadow.camera.bottom = -300;
cityScene.add(directionalLight);

//creamos una luz ambiental
const ambientLight = new THREE.AmbientLight(0x947cfd, 1.0); //Color de la luz e Intensidad
cityScene.add(ambientLight);

//creamos el mixer para la animacion
let animationMixer = [];
//let previosRAF = null;
const clock = new THREE.Clock(); //Agregamos una constante clock para la variable deltaTime

//loadAnimatedModel(); por el momento no utilizar
/*
loadAnimatedModelAndPlay(
  "../resources/people/",
  "Character1.fbx",
  "Character1.fbx",
  new THREE.Vector3(-57, 0, 0)
);
loadAnimatedModelAndPlay(
  "../resources/people/",
  "Character2_P.fbx",
  "Character2_P.fbx",
  new THREE.Vector3(-90, 0, -150)
);
loadAnimatedModelAndPlay(
  "../resources/people/",
  "Character4_P.fbx",
  "Character4_P.fbx",
  new THREE.Vector3(-65, 0, 170)
);*/

//_RAF(previosRAF, renderer, cityScene, camera);

//Esto tiene que ver con el multijugador
var modelPlayerBB;
var jugadorNames = {};

var playerName = "nombre_del_jugador"; 

const starCountRef = ref(db, "jugador"); //EL PROFE NO LE DEJÓ EL SLASH
onValue(starCountRef, (snapshot) => {
  //currentPlayerKey = key; // Asignar el valor de key a currentPlayerKey
  const data = snapshot.val();
  //updateStarCount(postElement, data);   EL PROFE ELIMINÓ ESTO
  // console.log(data);
  Object.entries(data).forEach(([key, value]) => {
    //console.log(`${key} ${value}`);
    //console.log(key);
    //console.log(value);
    //key = keyglobal;
    const jugador = cityScene.getObjectByName(key);
    if (!jugador) {
      const loader = new FBXLoader();
      loader.setPath("../resources/taxi/");
      loader.load("taximodel.fbx", (fbx) => {
        fbx.scale.setScalar(0.1);
        fbx.rotateY(Math.PI); // Rotar el objeto 180 grados alrededor del eje Y
        fbx.traverse((c) => {
          c.castShadow = true;
        });
        fbx.position.set(value.x, 0, value.z);
        fbx.rotation.set(0, value.rotY, 0);
        //camera.position.set(value.x, cameraHeight , value.z);
        //fbx.material.color = new THREE.Color(Math.random() * 0xffffff);
        fbx.name = key;

        const jugadorInfo = { name: key };
        fbx.userData.jugadorInfo = jugadorInfo;
        jugadorNames[key] = jugadorInfo;
        //keyglobal = fbx.name;
        // Configurar la posición y orientación de la cámara
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(
          fbx.position.x,
          fbx.position.y + cameraHeight,
          fbx.position.z
        );
        camera.lookAt(fbx.position);
        fbx.add(camera);
        cityScene.add(fbx);

        const animLoader = new FBXLoader();
        animLoader.setPath("../resources/taxi/");
        animLoader.load("walkTaxi.fbx", (anim) => {
          const mixer = new THREE.AnimationMixer(fbx);
          animationMixer.push(mixer);
          const idleAction = mixer.clipAction(anim.animations[0]);
          idleAction.play();
        });

        // Crear la caja de colisión para el modelo animado
        modelPlayerBB = new THREE.Box3().setFromObject(fbx);
      });
    }

    cityScene.getObjectByName(key).position.x = value.x;
    cityScene.getObjectByName(key).position.z = value.z;
    cityScene.getObjectByName(key).rotation.y = value.rotY;

    //Tonto profesore
    //     // Update the user info div with the user ID and position
    //     if (key == currentUser.uid) {
    //       userInfoDiv.innerText = `User ID: ${key}\nPosition: (${value.x}, ${value.z})`;
    //     } soy cochué no me baño
    updateCamera();
  });
});

function writeUserData(userId, position, rotation) {
  // const db = getDatabase();
  set(ref(db, "jugador/" + userId), {
    x: position.x,
    z: position.z,
    rotY: rotation,
  });
}

function updateCamera() {
  const jugadorActual = cityScene.getObjectByName(currentUser.uid);
  if (jugadorActual) {
    // Actualizar la posición de la cámara para seguir al jugador
    camera.position.x = jugadorActual.position.x;
    camera.position.z = jugadorActual.position.z;

    // Ajustar la orientación de la cámara para mirar hacia abajo con una ligera inclinación hacia arriba
    const targetY = jugadorActual.position.y + cameraHeight;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.lookAt(
      new THREE.Vector3(
        jugadorActual.position.x,
        targetY - 10,
        jugadorActual.position.z
      )
    );
  }
}

/*function updateCamera() {
  const jugadorActual = cityScene.getObjectByName(currentUser.uid);
  if (jugadorActual) {
    // Actualizar la posición de la cámara para seguir al jugador
    camera.position.x = jugadorActual.position.x - cameraDistance * Math.sin(jugadorActual.rotation.y);
    camera.position.z = jugadorActual.position.z - cameraDistance * Math.cos(jugadorActual.rotation.y);

    // Mantener la orientación de la cámara hacia el jugador sin rotar
    camera.lookAt(new THREE.Vector3(jugadorActual.position.x, cameraHeight, jugadorActual.position.z));
  }
}*/

// // Crea una instancia del cargador FBX para cargar el taxi
// var taxiLoader = new THREE.FBXLoader();

// // Carga el archivo FBX
// taxiLoader.load(
//     'taximodel.fbx',
//     function ( object ) {
//         // Añade el objeto cargado a la escena
//         scene.add( object );
//     },
//     function ( xhr ) {
//         // Función de progreso de carga
//         console.log( ( xhr.loaded / xhr.total * 100 ) + '% cargado' );
//     },
//     function ( error ) {
//         // Función de error de carga
//         console.error( error );
//     }
// );



//Movimiento WASD
// let wPresionada = false;  // Variable que indica si la tecla W está siendo presionada
// let aPresionada = false;  // Variable que indica si la tecla A está siendo presionada
// let dPresionada = false;  // Variable que indica si la tecla D está siendo presionada

// document.onkeydown = function (e) {
//   if (!currentUser) {
//     return;
//   }

//   const jugadorActual = cityScene.getObjectByName(currentUser.uid);

//   if (e.keyCode == 37) {
//     aPresionada = true;
//   }

//   if (e.keyCode == 39) {
//     dPresionada = true;
//   }

//   if (e.keyCode == 87) {
//     wPresionada = true;
//   }

//   writeUserData(currentUser.uid, jugadorActual.position);
// };

// document.onkeyup = function (e) {
//   if (!currentUser) {
//     return;
//   }
//   const jugadorActual = cityScene.getObjectByName(currentUser.uid);

//   if (e.keyCode == 37) {
//     aPresionada = false;
//   }

//   if (e.keyCode == 39) {
//     dPresionada = false;
//   }

//   if (e.keyCode == 87) {
//     wPresionada = false;
//   }

//   writeUserData(currentUser.uid, jugadorActual.position);
// };

// function actualizarJugador() {
//   if (!currentUser) {
//     return;
//   }
//   const jugadorActual = cityScene.getObjectByName(currentUser.uid);

//   const rotationAngle = Math.PI / 2; // Ángulo de rotación en radianes
//   const moveDistance = 0.1; // Distancia de movimiento

//   if (wPresionada) {
//     const angle = jugadorActual.rotation.y;
//     jugadorActual.position.x -= Math.sin(angle) * moveDistance;
//     jugadorActual.position.z -= Math.cos(angle) * moveDistance;
//   }

//   if (aPresionada) {
//     jugadorActual.rotation.y -= rotationAngle;
//   }

//   if (dPresionada) {
//     jugadorActual.rotation.y += rotationAngle;
//   }

//   writeUserData(currentUser.uid, jugadorActual.position);
// }

// document.onkeydown = function (e) {
//   const jugadorActual = cityScene.getObjectByName(currentUser.uid);

//   const rotationAngle = Math.PI / 2; // Ángulo de rotación en radianes
//   const moveDistance = 0.1; // Distancia de movimiento

//   if (e.keyCode === 65) {
//     // Tecla A - Girar 90 grados en sentido contrario a las agujas del reloj
//     jugadorActual.rotation.y -= rotationAngle;
//   }

//   if (e.keyCode === 68) {
//     // Tecla D - Girar 90 grados en sentido de las agujas del reloj
//     jugadorActual.rotation.y += rotationAngle;
//   }

//   if (e.keyCode === 87) {
//     // Tecla W - Avanzar hacia adelante
//     const angle = jugadorActual.rotation.y;
//     jugadorActual.position.x -= Math.sin(angle) * moveDistance;
//     jugadorActual.position.z -= Math.cos(angle) * moveDistance;
//   }

//   if (e.keyCode === 83) {
//     // Tecla S - Retroceder hacia atrás
//     const angle = jugadorActual.rotation.y;
//     jugadorActual.position.x += Math.sin(angle) * moveDistance;
//     jugadorActual.position.z += Math.cos(angle) * moveDistance;
//   }

//   writeUserData(currentUser.uid, jugadorActual.position);
// };

//En caso de flechas
/*document.onkeydown = function (e) {
  const jugadorActual = cityScene.getObjectByName(currentUser.uid);

  if (e.keyCode == 37) { //flecha izq
    jugadorActual.position.x -= 1;
  }

  if (e.keyCode == 39) { //flecha derecha
    jugadorActual.position.x += 1;
  }

  if (e.keyCode == 38) { //flecha arriba
    jugadorActual.position.z -= 1;
  }

  if (e.keyCode == 40) { //flecha abajo
    jugadorActual.position.z += 1;
  }

  writeUserData(currentUser.uid, jugadorActual.position);

};*/

// document.onkeydown = function (e) {
//   const jugadorActual = cityScene.getObjectByName(currentUser.uid);
//   const moveDistance = 1; // Distancia de movimiento
//   let angle = jugadorActual.rotation.y;

//   updateCamera();

//   // Verificar si la rotación es un múltiplo de 90 grados
//   const is90DegreeRotation = Math.abs(angle - Math.PI / 2) % (Math.PI / 2) === 0;

//   if (e.keyCode === 68) {
//     // Tecla D - Girar 90 grados en sentido de las agujas del reloj
//     jugadorActual.rotation.y -= Math.PI / 2;
//     angle = jugadorActual.rotation.y;
//   }

//   if (e.keyCode === 65) {
//     // Tecla A - Girar 90 grados en sentido contrario a las agujas del reloj
//     jugadorActual.rotation.y += Math.PI / 2;
//     angle = jugadorActual.rotation.y;
//   }

//   if (e.keyCode === 87) {
//     // Tecla W - Avanzar hacia adelante en la dirección de rotación o en línea recta si la rotación no es múltiplo de 90 grados
//     if (is90DegreeRotation) {
//       jugadorActual.position.x += Math.sin(angle) * moveDistance;
//       jugadorActual.position.z += Math.cos(angle) * moveDistance;
//     } else {
//       jugadorActual.position.x -= Math.cos(angle) * moveDistance;
//       jugadorActual.position.z -= Math.sin(angle) * moveDistance;
//     }
//   }

//   if (e.keyCode === 83) {
//     // Tecla S - Retroceder hacia atrás en la dirección opuesta a la rotación o en línea recta si la rotación no es múltiplo de 90 grados
//     if (is90DegreeRotation) {
//       jugadorActual.position.x -= Math.sin(angle) * moveDistance;
//       jugadorActual.position.z -= Math.cos(angle) * moveDistance;
//     } else {
//       jugadorActual.position.x += Math.cos(angle) * moveDistance;
//       jugadorActual.position.z += Math.sin(angle) * moveDistance;
//     }
//   }

//   writeUserData(currentUser.uid, jugadorActual.position);
// };

//En caso de flechas
// document.onkeydown = function (e) {
//   const jugadorActual = cityScene.getObjectByName(currentUser.uid);

//   updateCamera();

//   if (e.keyCode == 37) { //flecha izq
//     jugadorActual.position.x -= 1;
//     jugadorActual.rotation.y = -Math.PI / 2;
//   }

//   if (e.keyCode == 39) { //flecha derecha
//     jugadorActual.position.x += 1;
//     jugadorActual.rotation.y = Math.PI / 2;
//   }

//   if (e.keyCode == 38) { //flecha arriba
//     jugadorActual.position.z -= 1;
//     jugadorActual.rotation.y = 0;
//   }

//   if (e.keyCode == 40) { //flecha abajo
//     jugadorActual.position.z += 1;
//     jugadorActual.rotation.y = Math.PI;
//   }

//   writeUserData(currentUser.uid, jugadorActual.position);
// };
// Mapeo de teclas
const KEY_LEFT = 65;
const KEY_RIGHT = 68;
const KEY_UP = 87;
const KEY_DOWN = 83;
const KEY_SHIFT = 16;

// Define una velocidad de movimiento
const normalMovementSpeed = 10;
const shiftMovementSpeed = normalMovementSpeed * 2;

// Variable para controlar si se está presionando la tecla Shift
let isShiftPressed = false;
const smoothness = 0.1; // Ajusta este valor para controlar la suavidad de la rotación

// Objeto para almacenar las teclas presionadas
const keysPressed = {};
let totalRotation = 0;

// Asignar evento a la tecla presionada
document.onkeydown = function (e) {
  const jugadorActual = cityScene.getObjectByName(currentUser.uid);

  console.log(jugadorActual);

  updateCamera();
  // movePlayer();

  keysPressed[e.keyCode] = true;

  if (e.keyCode === KEY_SHIFT) {
    // Tecla Shift presionada
    isShiftPressed = true;
  }

  updatePlayerMovement();
};

document.onkeyup = function (e) {
  delete keysPressed[e.keyCode];

  if (e.keyCode === KEY_SHIFT) {
    // Tecla Shift soltada
    isShiftPressed = false;
  }
  updatePlayerMovement();
};

// Actualizar el movimiento del jugador en cada fotograma
function updatePlayerMovement() {
  let jugadorActual = cityScene.getObjectByName(currentUser.uid);

  const movementSpeed = getMovementSpeed();

  if (keysPressed[KEY_LEFT]) {
    // Tecla A - Mover hacia la izquierda
    const targetPosition = jugadorActual.position
      .clone()
      .add(new THREE.Vector3(-movementSpeed, 0, 0));
    movePlayerSmoothly(jugadorActual, targetPosition);
    rotateSmoothly(jugadorActual, -Math.PI / 2);
  }

  if (keysPressed[KEY_RIGHT]) {
    // Tecla D - Mover hacia la derecha
    const targetPosition = jugadorActual.position
      .clone()
      .add(new THREE.Vector3(movementSpeed, 0, 0));
    movePlayerSmoothly(jugadorActual, targetPosition);
    rotateSmoothly(jugadorActual, Math.PI / 2);
  }

  if (keysPressed[KEY_UP]) {
    // Tecla W - Mover hacia arriba
    const targetPosition = jugadorActual.position
      .clone()
      .add(new THREE.Vector3(0, 0, -movementSpeed));
    movePlayerSmoothly(jugadorActual, targetPosition);
    rotateSmoothly(jugadorActual, Math.PI);
  }

  if (keysPressed[KEY_DOWN]) {
    // Tecla S - Mover hacia abajo
    const targetPosition = jugadorActual.position
      .clone()
      .add(new THREE.Vector3(0, 0, movementSpeed));
    movePlayerSmoothly(jugadorActual, targetPosition);
    rotateSmoothly(jugadorActual, 0);
  }

  console.log(keysPressed);

  writeUserData(
    currentUser.uid,
    jugadorActual.position,
    jugadorActual.rotation.y
  );
  //Colisiones con los personajes.
  checkModelBBCollision();
  checModelBB1WomanCollision();
  checModelBB1GrandmaCollision();


  //Colisiones con los powerUps
  checPowerSkullCollision();


  //Colisiones de los edificios.
  checkBuildingsCollisions();
  checkBuildingsCollisions2();
  checkBuildingsCollisions3();
  checkBuildingsCollisions4();
  checkBuildingsCollisions5();
  checkBuildingsCollisions6();
  checkBuildingsCollisions7();
  checkBuildingsCollisionsWall();
  checkBuildingsCollisionsWall2();
  checkBuildingsCollisionsWall3();
  checkBuildingsCollisionsWall4();

  jugadorBB.setFromObject(jugadorActual);
}

// Función para obtener la velocidad de movimiento actual
function getMovementSpeed() {
  return isShiftPressed ? shiftMovementSpeed : normalMovementSpeed;
}

// Función para mover suavemente al jugador
function movePlayerSmoothly(object, targetPosition) {
  // Calcula la distancia entre la posición actual y la posición objetivo
  const distance = object.position.distanceTo(targetPosition);

  // Define
  // Define la velocidad de movimiento en función de la distancia
  const movementSpeed = Math.min(distance, smoothness);

  // Interpola suavemente la posición actual hacia la posición objetivo
  object.position.lerp(targetPosition, movementSpeed);
}

// Función para rotar suavemente
function rotateSmoothly(object, targetRotationY) {
  const rotationSpeed = 0.1; // Ajusta la velocidad de rotación según sea necesario

  let currentRotation = object.rotation.y;
  let deltaRotation = targetRotationY - currentRotation;

  // Verificar si es necesario realizar una rotación completa
  if (Math.abs(deltaRotation) > Math.PI) {
    if (deltaRotation > 0) {
      deltaRotation -= 2 * Math.PI;
    } else {
      deltaRotation += 2 * Math.PI;
    }
  }

  let newRotation = currentRotation + rotationSpeed * deltaRotation;

  // Asegurarse de que la rotación esté dentro del rango de 0 a 2π (360 grados)
  if (newRotation < 0) {
    newRotation += 2 * Math.PI;
  } else if (newRotation >= 2 * Math.PI) {
    newRotation -= 2 * Math.PI;
  }

  object.rotation.y = newRotation;

  // //Código de Jancito bb mosho
  // // Calcula la diferencia entre la rotación actual y la rotación objetivo
  // const rotationDiff = targetRotationY - object.rotation.y;

  // // Utiliza una interpolación para suavizar la rotación
  // object.rotation.y += rotationDiff * smoothness;
}

//En caso de no sé, cochué tuvo un pedo con git hub


// Resize Handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

const jugadorID = "jugador1";

var modelBB;
let fbx;
//var jugadorBB;

function loadAnimatedModelAndPlay() {
  const loader = new FBXLoader();
  loader.setPath("../resources/people/");
  loader.load("Character1.fbx", (loadedfbx) => {
    fbx = loadedfbx;
    fbx.scale.setScalar(0.1);
    fbx.traverse((c) => {
      c.castShadow = true;
    });
    fbx.position.copy(new THREE.Vector3(-57, 0, 0));

    // Crear la caja de colisión para el modelo animado
    modelBB = new THREE.Box3().setFromObject(fbx);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/people/");
    animLoader.load("Character1.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbx);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbx);

    //checkCollisions();
  });
}

var modelBB1;
let fbx1;
//var jugadorBB;

function loadAnimatedModelAndPlayWoman() {
  const loader = new FBXLoader();
  loader.setPath("../resources/people/");
  loader.load("Character2_P.fbx", (loadedfbx22) => {
    fbx1 = loadedfbx22;
    fbx1.scale.setScalar(0.1);
    fbx1.traverse((c) => {
      c.castShadow = true;
    });
    fbx1.position.copy(new THREE.Vector3(-90, 0, -160));

    // Crear la caja de colisión para el modelo animado
    modelBB1 = new THREE.Box3().setFromObject(fbx1);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/people/");
    animLoader.load("Character2_P.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbx1);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbx1);

    //checkCollisions();
  });
}

var modelBB3;
let fbx3;
//var jugadorBB;

function loadAnimatedModelAndPlayGrandmaOhShitDamn() {
  const loader = new FBXLoader();
  loader.setPath("../resources/people/");
  loader.load("Character4_P.fbx", (loadedfbx23) => {
    fbx3 = loadedfbx23;
    fbx3.scale.setScalar(0.1);
    fbx3.traverse((c) => {
      c.castShadow = true;
    });
    fbx3.position.copy(new THREE.Vector3(-65, 0, 170));

    // Crear la caja de colisión para el modelo animado
    modelBB3 = new THREE.Box3().setFromObject(fbx3);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/people/");
    animLoader.load("Character4_P.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbx3);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbx3);

    //checkCollisions();
  });
}

var powerUpBB3; //Caja de colision
let fbxPowerUp1;  //fbx
//var jugadorBB;

function loadSkullPowerUp() {
  const loader = new FBXLoader();
  loader.setPath("../resources/powerUps/");
  loader.load("Skull_PowerUp1.fbx", (loadedfbx24) => {
    fbxPowerUp1 = loadedfbx24;
    fbxPowerUp1.scale.setScalar(0.1);
    fbxPowerUp1.traverse((c) => {
      c.castShadow = true;
    });
    fbxPowerUp1.position.copy(new THREE.Vector3(-57, 0, 15));  //Posición

    // Crear la caja de colisión para el modelo animado
    powerUpBB3 = new THREE.Box3().setFromObject(fbxPowerUp1);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/powerUps/");
    animLoader.load("Skull_PowerUp1.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxPowerUp1);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxPowerUp1);

    //checkCollisions();
  });
}

var modelConstruction1;
let fbxConstruction;

function loadConstruction1() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("hotel.fbx", (loadedfbx1) => {
    fbxConstruction = loadedfbx1;
    fbxConstruction.scale.setScalar(0.1);
    fbxConstruction.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction.position.copy(new THREE.Vector3(90, 0, -120));

    // Crear la caja de colisión para el modelo animado
    modelConstruction1 = new THREE.Box3().setFromObject(fbxConstruction);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("hotel.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstruction);

    //checkCollisions();
  });
}

var wall1;
let fbxConstructionWall;

function loadConstructionWallSide() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("wall_sides.fbx", (loadedfbWall) => {
    fbxConstructionWall = loadedfbWall;
    fbxConstructionWall.scale.setScalar(0.1);
    fbxConstructionWall.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstructionWall.position.copy(new THREE.Vector3(0, 0, -115));

    // Crear la caja de colisión para el modelo animado
    wall1 = new THREE.Box3().setFromObject(fbxConstructionWall);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("wall_sides.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstructionWall);

    //checkCollisions();
  });
}

var wall2;
let fbxConstructionWall2;

function loadConstructionWallSide2() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("wall_sides.fbx", (loadedfbWal2l) => {
    fbxConstructionWall2 = loadedfbWal2l;
    fbxConstructionWall2.rotateY(Math.PI/2);
    fbxConstructionWall2.scale.setScalar(0.1);
    fbxConstructionWall2.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstructionWall2.position.copy(new THREE.Vector3(-115, 0, -5));

    // Crear la caja de colisión para el modelo animado
    wall2 = new THREE.Box3().setFromObject(fbxConstructionWall2);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("wall_sides.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstructionWall2);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstructionWall2);

    //checkCollisions();
  });
}

var wall3;
let fbxConstructionWall3;

function loadConstructionWallSide3() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("wall_sides.fbx", (loadedfbWal3l) => {
    fbxConstructionWall3 = loadedfbWal3l;
    fbxConstructionWall3.rotateY(Math.PI/2);
    fbxConstructionWall3.scale.setScalar(0.1);
    fbxConstructionWall3.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstructionWall3.position.copy(new THREE.Vector3(275, 0, 5));

    // Crear la caja de colisión para el modelo animado
    wall3 = new THREE.Box3().setFromObject(fbxConstructionWall3);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("wall_sides.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstructionWall3);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstructionWall3);

    //checkCollisions();
  });
}

var wall4;
let fbxConstructionWall4;

function loadConstructionWallSide4() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("wall_sides.fbx", (loadedfbWal4l) => {
    fbxConstructionWall4 = loadedfbWal4l;
    fbxConstructionWall4.scale.setScalar(0.1);
    fbxConstructionWall4.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstructionWall4.position.copy(new THREE.Vector3(0, 0, 285));

    // Crear la caja de colisión para el modelo animado
    wall4 = new THREE.Box3().setFromObject(fbxConstructionWall4);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("wall_sides.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstructionWall4);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstructionWall4);

    //checkCollisions();
  });
}

var modelConstruction2;
let fbxConstruction2;

function loadConstruction2() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("flowerBuilding.fbx", (loadedfbx2) => {
    fbxConstruction2 = loadedfbx2;
    fbxConstruction2.scale.setScalar(0.1);
    fbxConstruction2.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction2.position.copy(new THREE.Vector3(-90, 0, -10));

    // Crear la caja de colisión para el modelo animado
    modelConstruction2 = new THREE.Box3().setFromObject(fbxConstruction2);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("flowerBuilding.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction2);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstruction2);

    //checkCollisions();
  });
}

var modelConstruction3;
let fbxConstruction3;

function loadConstruction3() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("redBuilding.fbx", (loadedfbx3) => {
    fbxConstruction3 = loadedfbx3;
    fbxConstruction3.scale.setScalar(0.1);
    fbxConstruction3.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction3.position.copy(new THREE.Vector3(0, 0, 130));

    // Crear la caja de colisión para el modelo animado
    modelConstruction3 = new THREE.Box3().setFromObject(fbxConstruction3);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("redBuilding.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction3);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstruction3);

    //checkCollisions();
  });
}

var modelConstruction4;
let fbxConstruction4;

function loadConstruction4() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("greenBuilding.fbx", (loadedfbx4) => {
    fbxConstruction4 = loadedfbx4;
    fbxConstruction4.scale.setScalar(0.1);
    fbxConstruction4.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction4.position.copy(new THREE.Vector3(-130, 0, 130));

    // Crear la caja de colisión para el modelo animado
    modelConstruction4 = new THREE.Box3().setFromObject(fbxConstruction4);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("greenBuilding.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction4);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstruction4);

    //checkCollisions();
  });
}

var modelConstruction5;
let fbxConstruction5;

function loadConstruction5() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("libraryBuilding.fbx", (loadedfbx5) => {
    fbxConstruction5 = loadedfbx5;
    fbxConstruction5.scale.setScalar(0.1);
    fbxConstruction5.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction5.position.copy(new THREE.Vector3(-90, 0, -100));

    // Crear la caja de colisión para el modelo animado
    modelConstruction5 = new THREE.Box3().setFromObject(fbxConstruction5);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("libraryBuilding.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction5);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstruction5);

    //checkCollisions();
  });
}

var modelConstruction6;
let fbxConstruction6;

function loadConstruction6() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("gasoline.fbx", (loadedfbx6) => {
    fbxConstruction6 = loadedfbx6;
    fbxConstruction6.scale.setScalar(0.1);
    fbxConstruction6.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction6.position.copy(new THREE.Vector3(-20, 0, 150));

    // Crear la caja de colisión para el modelo animado
    modelConstruction6 = new THREE.Box3().setFromObject(fbxConstruction6);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("gasoline.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction6);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstruction6);

    //checkCollisions();
  });
}

var modelConstruction7;
let fbxConstruction7;

function loadConstruction7() {
  const loader = new FBXLoader();
  loader.setPath("../resources/buildings/");
  loader.load("redBuilding.fbx", (loadedfbx7) => {
    fbxConstruction7 = loadedfbx7;
    fbxConstruction7.scale.setScalar(0.1);
    fbxConstruction7.traverse((c) => {
      c.castShadow = true;
    });
    fbxConstruction7.position.copy(new THREE.Vector3(90, 0, 20));

    // Crear la caja de colisión para el modelo animado
    modelConstruction7 = new THREE.Box3().setFromObject(fbxConstruction7);

    const animLoader = new FBXLoader();
    animLoader.setPath("../resources/buildings/");
    animLoader.load("redBuilding.fbx", (anim) => {
      const mixer = new THREE.AnimationMixer(fbxConstruction7);
      animationMixer.push(mixer);
      const idleAction = mixer.clipAction(anim.animations[0]);
      idleAction.play();

      checkCollisions();
      animate();
    });

    cityScene.add(fbxConstruction7);

    //checkCollisions();
  });
}

// Llamar a la función para cargar el modelo animado
loadAnimatedModelAndPlay();
loadAnimatedModelAndPlayWoman();
loadAnimatedModelAndPlayGrandmaOhShitDamn();

//Cargamos los powerups
loadSkullPowerUp();

//Cargar las construcciones
loadConstruction1();
loadConstruction2();
loadConstruction3();
loadConstruction4();
loadConstruction5();
loadConstruction6();
loadConstruction7();
loadConstructionWallSide();
loadConstructionWallSide2();
loadConstructionWallSide3();
loadConstructionWallSide4();

function checkCollisions() {
  // Obtener la caja de colisión del jugador
  jugadorBB = new THREE.Box3().setFromObject(
    cityScene.getObjectByName(jugadorNames)
  );
}

/*function checkModelBBCollision() {
  // Comprobar colisión entre fbx (modelBB) y jugadorBB

  //Aquí se genera la lógica de la colisión
  if (modelBB.intersectsBox(jugadorBB)) {
    console.log("Colisión con el modelo fbx y el jugador");
     fbx.position.y -= 10;
     modelBB.min.y -= 10; // Ejemplo: incrementar los límites mínimos en el eje x en 1 unidad
     modelBB.max.y -= 10; // Ejemplo: incrementar los límites máximos en el eje x en 1 unidad
  }
}*/

function checkModelBBCollision() {
  // Comprobar colisión entre fbx (modelBB) y jugadorBB

  //Aquí se genera la lógica de la colisión para el character1
  if (modelBB.intersectsBox(jugadorBB)) {
    console.log("Colisión con el modelo del hombre y el jugador");

    const desplazamiento = new THREE.Vector3(0, -10, 0); // Desplazamiento hacia abajo

    // Obtener la posición actual del modelo
    const modelPosition = fbx.position.clone();

    // Aplicar el desplazamiento a la posición del modelo
    modelPosition.add(desplazamiento);

    // Actualizar la posición del modelo
    fbx.position.copy(modelPosition);

    // Actualizar la caja de colisión del modelo
    modelBB.min.add(desplazamiento);
    modelBB.max.add(desplazamiento);

    // Verificar si todos los jugadores han colisionado
    let jugadoresColisionados = 0;
    const totalJugadores = Object.keys(jugadorNames).length;

    for (const key in jugadorNames) {
      if (Object.hasOwnProperty.call(jugadorNames, key)) {
        const jugadorInfo = jugadorNames[key];
        const jugadorBB = new THREE.Box3().setFromObject(
          cityScene.getObjectByName(jugadorInfo.name)
        );

        if (modelBB.intersectsBox(jugadorBB)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);
        }
      }
    }

    if (jugadoresColisionados === totalJugadores) {
      console.log("Todos los jugadores han colisionado con el modelo");
    }
  }
  
}

function checModelBB1WomanCollision() {
  if (modelBB1.intersectsBox(jugadorBB)) {
    console.log("Colisión con el modelo de la mujer y el jugador");

    const desplazamiento1 = new THREE.Vector3(0, -10, 0); // Desplazamiento hacia abajo

    // Obtener la posición actual del modelo
    const modelPosition1 = fbx1.position.clone();

    // Aplicar el desplazamiento a la posición del modelo
    modelPosition1.add(desplazamiento1);

    // Actualizar la posición del modelo
    fbx1.position.copy(modelPosition1);

    // Actualizar la caja de colisión del modelo
    modelBB1.min.add(desplazamiento1);
    modelBB1.max.add(desplazamiento1);

    // Verificar si todos los jugadores han colisionado
    let jugadoresColisionados1 = 0;
    const totalJugadores1 = Object.keys(jugadorNames).length;

    for (const key in jugadorNames) {
      if (Object.hasOwnProperty.call(jugadorNames, key)) {
        const jugadorInfo = jugadorNames[key];
        const jugadorBB = new THREE.Box3().setFromObject(
          cityScene.getObjectByName(jugadorInfo.name)
        );

        if (modelBB1.intersectsBox(jugadorBB)) {
          jugadoresColisionados1++;
          console.log("Colisión con el jugador:", key);
        }
      }
    }

    if (jugadoresColisionados1 === totalJugadores1) {
      console.log("Todos los jugadores han colisionado con el modelo");
    }
  }
}

function checModelBB1GrandmaCollision() {
  if (modelBB3.intersectsBox(jugadorBB)) {
    console.log("Colisión con el modelo de la mujer y el jugador");

    const desplazamiento1 = new THREE.Vector3(0, -10, 0); // Desplazamiento hacia abajo

    // Obtener la posición actual del modelo
    const modelPosition1 = fbx3.position.clone();

    // Aplicar el desplazamiento a la posición del modelo
    modelPosition1.add(desplazamiento1);

    // Actualizar la posición del modelo
    fbx3.position.copy(modelPosition1);

    // Actualizar la caja de colisión del modelo
    modelBB3.min.add(desplazamiento1);
    modelBB3.max.add(desplazamiento1);

    // Verificar si todos los jugadores han colisionado
    let jugadoresColisionados1 = 0;
    const totalJugadores1 = Object.keys(jugadorNames).length;

    for (const key in jugadorNames) {
      if (Object.hasOwnProperty.call(jugadorNames, key)) {
        const jugadorInfo = jugadorNames[key];
        const jugadorBB = new THREE.Box3().setFromObject(
          cityScene.getObjectByName(jugadorInfo.name)
        );

        if (modelBB1.intersectsBox(jugadorBB)) {
          jugadoresColisionados1++;
          console.log("Colisión con el jugador:", key);
        }
      }
    }

    if (jugadoresColisionados1 === totalJugadores1) {
      console.log("Todos los jugadores han colisionado con el modelo");
    }
  }
}

function checPowerSkullCollision() {
  if (powerUpBB3.intersectsBox(jugadorBB)) {
    console.log("Colisión con el modelo del powerup");

    const desplazamiento1 = new THREE.Vector3(0, -10, 0); // Desplazamiento hacia abajo

    // Obtener la posición actual del modelo
    const modelPosition1 = fbxPowerUp1.position.clone();

    // Aplicar el desplazamiento a la posición del modelo
    modelPosition1.add(desplazamiento1);

    // Actualizar la posición del modelo
    fbxPowerUp1.position.copy(modelPosition1);

    // Actualizar la caja de colisión del modelo
    powerUpBB3.min.add(desplazamiento1);
    powerUpBB3.max.add(desplazamiento1);

    // Verificar si todos los jugadores han colisionado
    let jugadoresColisionados1 = 0;
    const totalJugadores1 = Object.keys(jugadorNames).length;

    for (const key in jugadorNames) {
      if (Object.hasOwnProperty.call(jugadorNames, key)) {
        const jugadorInfo = jugadorNames[key];
        const jugadorBB = new THREE.Box3().setFromObject(
          cityScene.getObjectByName(jugadorInfo.name)
        );

        if (modelBB1.intersectsBox(jugadorBB)) {
          jugadoresColisionados1++;
          console.log("Colisión con el jugador:", key);
        }
      }
    }

    if (jugadoresColisionados1 === totalJugadores1) {
      console.log("Todos los jugadores han colisionado con el modelo");
    }
  }
}

let jugadoresColisionados = 0; // Definir la variable jugadoresColisionados antes de su uso


function checkBuildingsCollisions() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction1 && jugadorBB.intersectsBox(modelConstruction1)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstruction.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisionsWall() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (wall1 && jugadorBB.intersectsBox(wall1)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstructionWall.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(-2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisionsWall2() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (wall2 && jugadorBB.intersectsBox(wall2)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstructionWall2.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(-2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisionsWall3() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (wall3 && jugadorBB.intersectsBox(wall3)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstructionWall3.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisionsWall4() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (wall4 && jugadorBB.intersectsBox(wall4)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstructionWall4.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}


function checkBuildingsCollisions2() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction2 && jugadorBB.intersectsBox(modelConstruction2)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstruction2.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisions3() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction3 && jugadorBB.intersectsBox(modelConstruction3)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstruction3.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisions4() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction4 && jugadorBB.intersectsBox(modelConstruction4)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstruction4.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisions5() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction5 && jugadorBB.intersectsBox(modelConstruction5)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstruction5.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisions6() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction6 && jugadorBB.intersectsBox(modelConstruction6)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstruction6.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(1.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

function checkBuildingsCollisions7() {
  for (const key in jugadorNames) {
    if (Object.hasOwnProperty.call(jugadorNames, key)) {
      const jugadorInfo = jugadorNames[key];
      const jugador = cityScene.getObjectByName(jugadorInfo.name);

      if (jugador && jugadorInfo) {
        const jugadorBB = new THREE.Box3().setFromObject(jugador);

        if (modelConstruction7 && jugadorBB.intersectsBox(modelConstruction7)) {
          jugadoresColisionados++;
          console.log("Colisión con el jugador:", key);

          // Calcular el vector de retroceso
          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
          const construccionPosition = new THREE.Vector3().copy(fbxConstruction7.position);
          const retroceso = jugadorPosition.sub(construccionPosition).normalize().multiplyScalar(2.5); // Ajusta el valor de retroceso según sea necesario

          // Retroceder al jugador
          jugador.position.add(retroceso);
        }
      }
    }
  }
}

// function checkBuildingsCollisions() {
//   for (const key in jugadorNames) {
//     if (Object.hasOwnProperty.call(jugadorNames, key)) {
//       const jugadorInfo = jugadorNames[key];
//       const jugador = cityScene.getObjectByName(jugadorInfo.name);

//       if (jugador && jugadorInfo) {
//         const jugadorBB = new THREE.Box3().setFromObject(jugador);

//         if (modelConstruction1 && jugadorBB.intersectsBox(modelConstruction1)) {
//           jugadoresColisionados++;
//           console.log("Colisión con el jugador:", key);

//           // Retroceder al jugador
//           const retroceso = 10; // Ajusta el valor según sea necesario
//           jugador.position.x -= retroceso;
//           jugador.position.z -= retroceso;
//         }
//       }
//     }
//   }
// }


// function checkBuildingsCollisions() {
//   for (const key in jugadorNames) {
//     if (Object.hasOwnProperty.call(jugadorNames, key)) {
//       const jugadorInfo = jugadorNames[key];
//       const jugador = cityScene.getObjectByName(jugadorInfo.name);

//       if (jugador && jugadorInfo) {
//         const jugadorBB = new THREE.Box3().setFromObject(jugador);

//         if (modelConstruction1 && jugadorBB.intersectsBox(modelConstruction1)) {
//           jugadoresColisionados++;
//           console.log("Colisión con el jugador:", key);
//         }
//       }
//     }
//   }
// }

// Verificar colisiones en cada actualización de fotograma
// function checkBuildingsCollisions() {
//   // Obtener las cajas de colisión del jugador y el modelo colisionado
//   const playerBB = modelPlayerBB.clone(); // Clonar la caja de colisión del jugador
//   const constructionBB = modelConstruction1.clone(); // Clonar la caja de colisión del modelo colisionado
  

//   const jugadorInfo = jugadorNames[playerName];
//   const jugador = cityScene.getObjectByName(jugadorInfo.name);   
//   // Mover las cajas de colisión según la posición actual del jugador y el modelo colisionado
//   playerBB.translate(jugador.position); // Mover la caja de colisión del jugador
//   constructionBB.translate(fbxConstruction.position); // Mover la caja de colisión del modelo colisionado

//   for (const key in jugadorNames) {
//     if (Object.hasOwnProperty.call(jugadorNames, key)) {
//       const jugadorInfo = jugadorNames[key];
//       const jugadorBB = new THREE.Box3().setFromObject(
//         cityScene.getObjectByName(jugadorInfo.name)
//       );

//       if (modelBB.intersectsBox(jugadorBB)) {
//         jugadoresColisionados++;
//         console.log("Colisión con el jugador:", key);
//       }
//     }
//   }

//   // Comprobar si las cajas de colisión se superponen
//   if (playerBB.intersectsBox(constructionBB)) {
//     // Las cajas de colisión se superponen, lo que indica una colisión

//     // Aquí puedes agregar el código que deseas ejecutar cuando haya una colisión
//     // Por ejemplo, puedes detener el movimiento del jugador o aplicar alguna acción específica

//     // Para detener el movimiento del jugador, puedes deshabilitar los controles de movimiento:
//     // controls.enabled = false;

//     // O puedes establecer una variable de estado para indicar que el jugador está colisionando:
//     // isColliding = true;
//   } else {
//     // Las cajas de colisión no se superponen, no hay colisión

//     // Aquí puedes agregar el código que deseas ejecutar cuando no haya colisión
//     // Por ejemplo, puedes permitir que el jugador se mueva nuevamente o revertir la acción realizada en la colisión

//     // Para permitir el movimiento del jugador nuevamente, puedes habilitar los controles de movimiento:
//     // controls.enabled = true;

//     // Si usaste una variable de estado, puedes restablecerla:
//     // isColliding = false;
//   }
// }

let jugadorBB = new THREE.Box3(); // Inicializar jugadorBB con una instancia de Box3

// function movePlayer() {
//   // Lógica para mover al jugador
//   // ...

//   // Actualizar la posición de la caja de colisión del jugador
//   jugadorBB.setFromObject(jugadorActual);
// }

//const cameraControl = new OrbitControls(camera, renderer.domElement);

/*function checkCollisions() {
  if (spongebobBB.intersectsSphere(patrickBB)) {
    patrick.material.wireframe = true;
  } else {
    patrick.material.wireframe = false;
  }
  if (spongebobBB.containsBox(mrKrabsBB)) {
    mrKrabs.scale.y = 2;
  } else {
    mrKrabs.scale.y = 1;
  }
  if (spongebobBB.intersectsBox(mrKrabsBB)) {
    mrKrabs.material.color = new THREE.Color("orange");
  } else {
    mrKrabs.material.color = new THREE.Color("red");
  }

  if (spongebobBB.intersectsBox(squidwardBB)) {
    squidward.position.set(0, 0.5, -2);
  } else {
    squidward.position.set(0, 0.5, 0);
  }

  if (spongebobBB.intersectsBox(modelBB)) {
    // Establecer la posición deseada del modelo animado cuando hay colisión
    fbx.position.set(0, 0.6, 0);
  }

  const sandyIntersection = spongebobBB.intersect(sandyBB);
  if (!sandyIntersection.isEmpty()) {
    sandy.material.opacity = 0.5;
  } else {
    sandy.material.opacity = 1;
  }
}*/

/*function animate() {
  spongebobBB
    .copy(spongebob.geometry.boundingBox)
    .applyMatrix4(spongebob.matrixWorld);
  checkCollisions();
  renderer.render(cityScene, camera);
  requestAnimationFrame(animate);
}

animate();*/
//raf();

/*loadAnimatedModelAndPlay(
  "../resources/people/",
  "Character1.fbx",
  "Character1.fbx",
  new THREE.Vector3(-57, 0, 0)
);*/
//function loadAnimatedModelAndPlay(path, modelFile, animFile, offset)

/*function _RAF(previousRAF, threejs, scene, camera) {
  requestAnimationFrame((t) => {
    if (previousRAF === null) {
      previousRAF = t;
    }

    _RAF(previousRAF, threejs, scene, camera);

    threejs.render(scene, camera);
    _Step(t - previousRAF);
    previousRAF = t;
  });
}*/

/*function _Step(timeElapsed) {
  const timeElapsedS = timeElapsed * 0.001;
  if (mixers) {
    mixers.map((m) => m.update(timeElapsedS));
  }

  if (controls) {
    controls.Update(timeElapsedS);
  }
}*/

function animate() {
  const deltaTime = clock.getDelta();

  // spongebobBB
  //   .copy(spongebob.geometry.boundingBox)
  //   .applyMatrix4(spongebob.matrixWorld);
  //checkCollisions();

  //movePlayer();

  // Verificar colisiones en cada fotograma
  //checkModelBBCollision();
  //updateCamera();
  if (!cameraInitialized) {
    camera.position.set(25, 10, 25); // Ajusta la altura según tus necesidades
    camera.lookAt(new THREE.Vector3(25, 0, 25)); // Punto de enfoque hacia abajo
    cameraInitialized = true;
  }

  for (let i = 0; i < animationMixer.length; i++) {
    animationMixer[i].update(deltaTime);
  }

  //actualizarJugador();
  renderer.render(cityScene, camera);
  requestAnimationFrame(animate);
}

animate();

// function raf() {
//   requestAnimationFrame((t) => {
//     if (previosRAF === null) {
//       previosRAF = t;
//     }

//     raf();

//     renderer.render(cityScene, camera);
//     step(t - previosRAF);
//     previosRAF = t;
//   });
// }

// function step(timeElapsed) {
//   const timeElapsedS = timeElapsed * 0.001;
//   if (animationMixer) {
//     animationMixer.map((m) => m.update(timeElapsedS));
//   }

//   //   if (this._controls) {
//   //     this._controls.Update(timeElapsedS);
//   //   }

//   //this._thirdPersonCamera.Update(timeElapsedS);
// }

// class ThirdPersonCamera {
//   constructor(params) {
//     this._params = params;
//     this._camera = params.camera;

//     this._currentPosition = new THREE.Vector3();
//     this._currentLookat = new THREE.Vector3();
//   }

//   _CalculateIdealOffset() {
//     const idealOffset = new THREE.Vector3(0, 90, -5);
//     //idealOffset.applyQuaternion(this._params.target.Rotation);
//     idealOffset.add(this._params.target.Position);
//     return idealOffset;
//   }

//   _CalculateIdealLookat() {
//     const idealLookat = new THREE.Vector3(0, 0, 0);
//     idealLookat.applyQuaternion(this._params.target.Rotation);
//     idealLookat.add(this._params.target.Position);
//     return idealLookat;
//   }

//   Update(timeElapsed) {
//     const idealOffset = this._CalculateIdealOffset();
//     const idealLookat = this._CalculateIdealLookat();

//     // const t = 0.05;
//     // const t = 4.0 * timeElapsed;
//     const t = 1.0 - Math.pow(0.001, timeElapsed);

//     this._currentPosition.lerp(idealOffset, t);
//     this._currentLookat.lerp(idealLookat, t);

//     this._camera.position.copy(this._currentPosition);
//     this._camera.lookAt(this._currentLookat);
//   }
// }
