      //modulos para THREE JS
      import * as THREE1 from "/assets/js/three.module.js";
      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
      import { OrbitControls } from "/assets/js/OrbitControls.js";
      import { GLTFLoader } from "/assets/js/GLTFLoader.js";
      import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js";
      import { OBJLoader } from "/assets/js/OBJLoader.js";
      import { MTLLoader } from "/assets/js/MTLLoader.js";

      //modulos para multiplayer
      import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js"; //obligatorio, pone el firebase en marcha
      import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-auth.js";
      import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js"

      // Your web app's Firebase configuration
      const firebaseConfig = {
          apiKey: "AIzaSyDcPOGxMUJvwLWx_debKErU1774YvicotE",
          authDomain: "coordenadas-6912f.firebaseapp.com",
          databaseURL: "https://coordenadas-6912f-default-rtdb.firebaseio.com",
          projectId: "coordenadas-6912f",
          storageBucket: "coordenadas-6912f.appspot.com",
          messagingSenderId: "729364270537",
          appId: "1:729364270537:web:b55da823b41ab85ad16c18"
      };

      var hizoLogin = false;
      var rotacionJugador = new THREE1.Vector3(0, 0, 0);
      //variables para el control del jugador
      var aceleracion = 0.0;
      var velocidadMaxima = 0.85; //2.0
      const velocidad = 0.1; //0.5
      const friccion = 0.020; //0.05
      var pointA = new Float32Array();
      var direction = new Float32Array();
      var barraVida = document.getElementById("barraVidaCSS");

      const bullets = [];
      var vidaActualCSS = 100;
      var DispararBalasTimer = 0.00;
      var limiteDispararBalasTimer = 10.00;
      var velocidadExtra = false;

      var DireccionesInputs = [0, 0, 0, 0]; //izquierda, derecha, arriba, abajo
      var DireccionesInercia = [0, 0, 0, 0]; //Cuál fué el último input que se puso?, izq/der/arr/aba

      //movimiento fluido al presionar una tecla
      var keyState = {};

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
                  crearUserData(user.uid, { x: 0, z: 0 });
                  hizoLogin = true;
                  // IdP data available using getAdditionalUserInfo(result)
                  // ...
              }).catch((error) => {
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
      var planePlayer = new THREE1.Plane(new THREE1.Vector3(0, 1, 0)); //plano en el que se va a rotar
      var raycaster = new THREE1.Raycaster(); //Ayuda a determinar la linea
      var mouse = new THREE1.Vector2();
      var pointOfIntersection = new THREE1.Vector3();
      window.addEventListener("mousemove", onMouseMove, false);

      buttonLogin.addEventListener("click", async() => {
          const user = await login();
      });

      buttonLogout.addEventListener("click", async() => {
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

      function crearUserData(userId, position) {
          set(ref(db, "jugador/" + userId), {
              x: position.x,
              z: position.z,
              playerRotation: rotacionJugador,
              salud: 100
                  //puntoInterseccion: pointOfIntersection
          });
      }

      //le resta vida al usuario
      function damageUserData(userId) {
          get(ref(db, `jugador/${userId}`)).then((snapshot) => {
              if (snapshot.exists()) {
                  //console.log(snapshot.val().salud);
                  const x = snapshot.val().x;
                  const z = snapshot.val().x;
                  const rotacionDamage = snapshot.val().playerRotation;
                  const vida = (snapshot.val().salud) - 10;
                  if (vida < 0) {
                      const jugadorPerdedor = scene.getObjectByName(userId);
                      jugadorPerdedor.visible = false;
                  }
                  set(ref(db, "jugador/" + userId), {
                      x: x,
                      z: z,
                      playerRotation: rotacionDamage,
                      salud: vida
                  });
              } else {
                  console.log("No data available");
              }
          }).catch((error) => {
              console.error(error);
          });
      }

      //Suma vida al usuario
      function regenerateHealthUserData(userId) {
          get(ref(db, `jugador/${userId}`)).then((snapshot) => {
              if (snapshot.exists()) {
                  //console.log(snapshot.val().salud);
                  const x = snapshot.val().x;
                  const z = snapshot.val().x;
                  const rotacionDamage = snapshot.val().playerRotation;
                  const vida = (snapshot.val().salud) + 50;
                  if (vida < 0) {
                      const jugadorPerdedor = scene.getObjectByName(userId);
                      jugadorPerdedor.visible = false;
                  }
                  set(ref(db, "jugador/" + userId), {
                      x: x,
                      z: z,
                      playerRotation: rotacionDamage,
                      salud: vida
                  });
              } else {
                  console.log("No data available");
              }
          }).catch((error) => {
              console.error(error);
          });
      }


      //en cada frame busca en la firebase para determinar si has ganado o perdido
      function estado() {
          const jugadorActual = scene.getObjectByName(currentUser.uid);
          var ganador = 0;
          var idGanador;
          get(ref(db, `jugador/${jugadorActual.name}`)).then((snapshot) => {
              if (snapshot.exists()) {

                  vidaActualCSS = snapshot.val().salud;
                  var str = vidaActualCSS + "%";
                  console.log(str);
                  document.getElementById("barraVidaCSS").style.width = str;

                  if (snapshot.val().salud <= 0) {
                      jugadorActual.visible = false;
                      alert("Has perdido, espera a que los jugadores hayan terminado la partida")
                  }

              } else {
                  console.log("No data available");
              }
          }).catch((error) => {
              console.error(error);
          });

          const starCountRef = ref(db, "jugador/");
          onValue(starCountRef, (snapshot) => { //ONVALUE se ejecuta cada vez que cambia la base de datos
              const data = snapshot.val();
              Object.entries(data).forEach(([key, value]) => { //por cada entidad
                  if (value.salud > 0) {
                      idGanador = key;
                      ganador += 1;
                  }
              });
          });

          /* if ((ganador==1)&&(jugadorActual.name==idGanador))
           {
               alert("¡Has ganado!");
           }*/

          ganador = 0;
          idGanador = "";

      }


      //actualiza especialmente el movimiento
      function writeUserData(userId, position) {
          get(ref(db, `jugador/${userId}/salud`)).then((snapshot) => {
              if (snapshot.exists()) {
                  set(ref(db, "jugador/" + userId), {
                      x: position.x,
                      z: position.z,
                      playerRotation: rotacionJugador,
                      salud: snapshot.val()
                          //puntoInterseccion: pointOfIntersection
                  });
              } else {
                  console.log("No data available");
              }
          }).catch((error) => {
              console.error(error);
          });
      }

      //elimina al usuario al cerrar sesión
      function deleteUser(userId) {
          set(ref(db, "jugador/" + userId), {
              x: null,
              z: null,
              playerRotation: null,
              salud: null
          });
          location.reload();
      }

      //var boxCollisionPlayer;
      var jugadorNames = {}; //El nombre del jugador --> Key

      const starCountRef = ref(db, "jugador/");
      onValue(starCountRef, (snapshot) => { //ONVALUE se ejecuta cada vez que cambia la base de datos
          const data = snapshot.val();
          Object.entries(data).forEach(([key, value]) => { //por cada entidad
              const jugador = scene.getObjectByName(key); //lo obtendremos de la clave j1 o j2, si no existe entonces lo agregamos a la escena
              if (!jugador) {
                  const geometry = new THREE1.BoxGeometry(1, 1, 1);
                  const material = new THREE1.MeshPhongMaterial();
                  const mesh = new THREE1.Mesh(geometry, material);
                  mesh.castShadow = true;
                  mesh.position.set(value.x, 0, value.z);
                  mesh.material.color = new THREE1.Color(Math.random() * 0xffffff);
                  mesh.name = key;

                  const jugadorInfo = { name: key };
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
      });


      //SCENE
      const scene = new THREE1.Scene(); //Crea la escena
      scene.background = new THREE1.Color("#34495E"); //Color de fondo

      const camera = new THREE1.PerspectiveCamera( //cámara
          30, //zoom
          window.innerWidth / window.innerHeight
      );
      camera.position.set(0, 40, 30); //que tan lejos está la camara

      // RENDER
      const renderer = new THREE.WebGLRenderer();
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);



      //Light
      const hemispherelight = new THREE1.HemisphereLight(0xffffbb, 0x080820, 1);
      //scene.add(hemispherelight);

      const directionallight = new THREE1.DirectionalLight(0xffffff, 1);
      directionallight.position.set(10, 10, -1);
      directionallight.castShadow = true; //habilitamos que puedan generar sombras


      //plano
      const planeGeometry = new THREE1.PlaneGeometry(50, 50);
      const planeMaterial = new THREE1.MeshStandardMaterial({ color: "slategrey" });
      const plane = new THREE1.Mesh(planeGeometry, planeMaterial);
      plane.position.set(0, -0.5, 0); //mueve el plano un poco más abajo
      plane.rotateX(-Math.PI / 2); //lo rota en x
      plane.receiveShadow = true; //puede recibir sombras

      document.onkeydown = function(e) {
          keyState[e.keyCode || e.which] = true;

          if ((e.keyCode == 37) || (e.keyCode == 65)) //D {
              writeUserData();
          if ((e.keyCode == 39) || (e.keyCode == 68))
              writeUserData();
          if ((e.keyCode == 38) || (e.keyCode == 87))
              writeUserData();
          if ((e.keyCode == 40) || (e.keyCode == 83))
              writeUserData();

          if (e.keyCode == 32) { //Espacio
          }

          //writeUserData(currentUser.uid, jugadorActual.position);
      };

      document.onkeyup = function(e) {
          if ((e.keyCode == 37) || (e.keyCode == 65)) //D {
              DireccionesInputs[0] = 0
          if ((e.keyCode == 39) || (e.keyCode == 68))
              DireccionesInputs[1] = 0
          if ((e.keyCode == 38) || (e.keyCode == 87))
              DireccionesInputs[2] = 0
          if ((e.keyCode == 40) || (e.keyCode == 83))
              DireccionesInputs[3] = 0

          if (e.keyCode == 16) { //S
              velocidadMaxima = velocidadMaxima / 2;
              velocidadExtra = false;
          }

          keyState[e.keyCode || e.which] = false;
      };

      function movimiento() {
          if (hizoLogin) {
              const jugadorActual = scene.getObjectByName(currentUser.uid);
              if (keyState[37] || keyState[65]) { //D
                  DireccionesInputs[0] = 1
                  DireccionesInercia = [1, 0, 0, 0];
                  aceleracion += (aceleracion < velocidadMaxima) ? 0.01 : 0.0;
                  jugadorActual.position.x -= velocidad * aceleracion;
              }

              if (keyState[39] || keyState[68]) { //A
                  aceleracion += (aceleracion < velocidadMaxima) ? 0.01 : 0.0;
                  DireccionesInputs[1] = 1
                  DireccionesInercia = [0, 1, 0, 0];
                  jugadorActual.position.x += velocidad * aceleracion;
              }

              if (keyState[38] || keyState[87]) { //W
                  aceleracion += (aceleracion < velocidadMaxima) ? 0.01 : 0.0;
                  DireccionesInputs[2] = 1
                  DireccionesInercia = [0, 0, 1, 0];
                  jugadorActual.position.z -= velocidad * aceleracion;
              }

              if (keyState[40] || keyState[83]) { //S
                  aceleracion += (aceleracion < velocidadMaxima) ? 0.01 : 0.0;
                  DireccionesInputs[3] = 1
                  DireccionesInercia = [0, 0, 0, 1];
                  jugadorActual.position.z += velocidad * aceleracion;
              }

              /*if (keyState[16] && !velocidadExtra) { //S
                  velocidadMaxima = velocidadMaxima * 2;
                  velocidadExtra = true;
              }*/

              if ((keyState[32]) && (DispararBalasTimer == 0)) { //Espacio
                  shoot();
                  DispararBalasTimer = 0.1;
              } else if ((DispararBalasTimer > 0) && (DispararBalasTimer < limiteDispararBalasTimer)) {
                  DispararBalasTimer += 0.1;
              } else if (DispararBalasTimer > limiteDispararBalasTimer) {
                  DispararBalasTimer = 0;
              }


              //checkBuildingsCollisions();
          }
      }

      function desacelerar() {
          if (hizoLogin) {
              const jugadorActual = scene.getObjectByName(currentUser.uid);
              if ((DireccionesInputs[0] == 0) && (DireccionesInputs[1] == 0) && (DireccionesInputs[2] == 0) && (DireccionesInputs[3] == 0)) {
                  if (aceleracion > 0.0) {
                      aceleracion -= friccion;

                      if (DireccionesInercia[0] == 1) {
                          jugadorActual.position.x -= velocidad * aceleracion;
                      } else if (DireccionesInercia[1] == 1) {
                          jugadorActual.position.x += velocidad * aceleracion;
                      } else if (DireccionesInercia[2] == 1) {
                          jugadorActual.position.z -= velocidad * aceleracion;
                      } else if (DireccionesInercia[3] == 1) {
                          jugadorActual.position.z += velocidad * aceleracion;
                      }
                  } else
                      aceleracion = 0;
              }
          }
      }


      let animationMixer = [];
      const clock = new THREE.Clock();
      // geometry
      const geometry = new THREE1.BufferGeometry();

      // attributes
      const vertices = new Float32Array([
          0.0, -1.0, 0.0,
          10.0, -1.0, 0.0,
      ]); // 3 vertices per point
      geometry.setAttribute('position', new THREE1.BufferAttribute(vertices, 3));

      // material
      const material = new THREE1.LineBasicMaterial({ color: 0x00008B });

      // line
      var lineaDisparo = new THREE1.Line(geometry, material);
      lineaDisparo.name = "lineaDisparo";
      scene.add(lineaDisparo);

      //adding to the scene
      scene.add(hemispherelight, directionallight);

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
              rotacionJugador = new THREE.Vector3(jugadorActual.rotation.x, jugadorActual.rotation.y, jugadorActual.rotation.z); //pasa la rotación actual 
              writeUserData(currentUser.uid, jugadorActual.position);
          }
      }

      const shoot = () => {
          const jugadorActual = scene.getObjectByName(currentUser.uid);
          const geometry2 = new THREE1.BoxGeometry(0.3, 1, 0.3);
          const material2 = new THREE1.MeshPhongMaterial();
          geometry2.quaternion = direction;
          const mesh2 = new THREE1.Mesh(geometry2, material2);
          mesh2.castShadow = true;
          mesh2.material.color = new THREE1.Color(Math.random() * 0xffffff);

          //posicion actual
          mesh2.position.x = jugadorActual.position.x;
          mesh2.position.z = jugadorActual.position.z;

          var vecRes = new THREE1.Vector3(direction[0], direction[1], direction[2]);

          /* console.log(mesh2.position.lerp(vecRes, 0.5));
          mesh2.position.lerp(vecRes, 0.0); */

          scene.add(mesh2);

          bullets.push({ mesh2, jugadorActual });
      };

      const updateBullets = () => {
          [...bullets].forEach(bullet => {
              const jugadorActual = scene.getObjectByName(currentUser.uid);
              var vecRes = new THREE1.Vector3(direction[0], direction[1], direction[2]);

              bullet.mesh2.position.lerp(vecRes, 0.075);

              const balaBB = new THREE.Box3().setFromObject(bullet.mesh2);
              //const jugadorBB = new THREE.Box3().setFromObject(jugador);

              for (const key in jugadorNames) {
                  if (Object.hasOwnProperty.call(jugadorNames, key)) {
                      const jugadorInfo = jugadorNames[key];
                      const jugador = scene.getObjectByName(jugadorInfo.name);

                      if (jugador && jugadorInfo) {
                          const jugadorBB = new THREE.Box3().setFromObject(jugador);
                          console.log("Jugador actual: " + jugador.name);
                          console.log("Bala disparada por: " + bullet.jugadorActual.name);

                          //Disparaste a alguien 
                          if (jugadorBB.intersectsBox(balaBB) && (jugador.name != bullet.jugadorActual.name)) { //si la bala ha chocado con un jugador, y no chocó contra sí mismo

                              scene.remove(bullet.mesh2); //remueve la bala del escenario
                              bullets.splice(bullet, 1); //lo remueve del arreglo de balas
                              damageUserData(jugador.name);
                          }
                      }
                  }
              }

              if (balaBB.containsPoint(vecRes)) {
                  scene.remove(bullet.mesh2); //si ha llegado hasta donde está el cursor sin darle a nadie
                  bullets.splice(bullet, 1); //lo remueve del arreglo de balas
              }

          });
      };

      //ajustar pantalla
      function resize() {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.render(scene, camera);
      }

      window.addEventListener('resize', resize);

      let jugadoresColisionados = 0;

      // ****************************************FBX*************************************************
      let HexWall;
      var Hex_Wall;

      function loadHexWall() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Hexx.fbx", (loadedHexWall) => {
              HexWall = loadedHexWall;
              HexWall.scale.setScalar(0.2);
              HexWall.traverse((c) => {
                  c.castShadow = true;
              });
              HexWall.position.copy(new THREE.Vector3(5, 0, 0));

              // Crear la caja de colisión para el modelo animado
              Hex_Wall = new THREE.Box3().setFromObject(HexWall);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Hexx.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(HexWall);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(HexWall);

              //checkCollisions();
          });
      }

      //
      let HexWall2;
      var Hex_Wall2;

      function loadHexWall2() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Hexx.fbx", (loadedHexWall2) => {
              HexWall2 = loadedHexWall2;
              HexWall2.scale.setScalar(0.3);
              HexWall2.traverse((c) => {
                  c.castShadow = true;
              });
              HexWall2.position.copy(new THREE.Vector3(0, 0, -15));

              // Crear la caja de colisión para el modelo animado
              Hex_Wall2 = new THREE.Box3().setFromObject(HexWall2);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Hexx.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(HexWall2);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(HexWall2);

              //checkCollisions();
          });
      }

      let HexWall3;
      var Hex_Wall3;

      function loadHexWall3() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Hexx.fbx", (loadedHexWall3) => {
              HexWall3 = loadedHexWall3;
              HexWall3.scale.setScalar(0.3);
              HexWall3.traverse((c) => {
                  c.castShadow = true;
              });
              HexWall3.position.copy(new THREE.Vector3(16, 0, 10));

              // Crear la caja de colisión para el modelo animado
              Hex_Wall3 = new THREE.Box3().setFromObject(HexWall3);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Hexx.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(HexWall3);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(HexWall3);

              //checkCollisions();
          });
      }

      let HexWall4;
      var Hex_Wall4;

      function loadHexWall4() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Hexx.fbx", (loadedHexWall4) => {
              HexWall4 = loadedHexWall4;
              HexWall4.scale.setScalar(0.5);
              HexWall4.traverse((c) => {
                  c.castShadow = true;
              });
              HexWall4.position.copy(new THREE.Vector3(-18, 0, -15));

              // Crear la caja de colisión para el modelo animado
              Hex_Wall4 = new THREE.Box3().setFromObject(HexWall4);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Hexx.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(HexWall4);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(HexWall4);

              //checkCollisions();
          });
      }

      let HexWall5;
      var Hex_Wall5;

      function loadHexWall5() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Hexx.fbx", (loadedHexWall5) => {
              HexWall5 = loadedHexWall5;
              HexWall5.scale.setScalar(0.5);
              HexWall5.traverse((c) => {
                  c.castShadow = true;
              });
              HexWall5.position.copy(new THREE.Vector3(-34, 0, 21));

              // Crear la caja de colisión para el modelo animado
              Hex_Wall5 = new THREE.Box3().setFromObject(HexWall5);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Hexx.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(HexWall5);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(HexWall5);

              //checkCollisions();
          });
      }

      //
      let BigHex;
      var BigHex_Box;

      function LoadBigHex() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("BigHex.fbx", (loadedBigHex) => {
              BigHex = loadedBigHex;
              BigHex.scale.setScalar(0.9);
              BigHex.traverse((c) => {
                  c.castShadow = true;
              });
              BigHex.position.copy(new THREE.Vector3(10, -2, -15));

              // Crear la caja de colisión para el modelo animado
              BigHex_Box = new THREE.Box3().setFromObject(BigHex);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("BigHex.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(BigHex);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(BigHex);

              //checkCollisions();
          });
      }

      //
      let HexMWall;
      var HexMWall_Box;

      function LoadHexMWall() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("HexMWall.fbx", (loadedHexMWall) => {
              HexMWall = loadedHexMWall;
              HexMWall.scale.setScalar(0.6);
              HexMWall.traverse((c) => {
                  c.castShadow = true;
              });
              HexMWall.position.copy(new THREE.Vector3(-76, 0, 0));

              // Crear la caja de colisión para el modelo animado
              HexMWall_Box = new THREE.Box3().setFromObject(HexMWall);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("HexMWall.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(HexMWall);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(HexMWall);

              //checkCollisions();
          });
      }


      //
      let HexMWall2;
      var HexMWall_Box2;

      function LoadHexMWall2() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("HexMWall2.fbx", (loadedHexMWall2) => {
              HexMWall2 = loadedHexMWall2;
              HexMWall2.scale.setScalar(0.6);
              HexMWall2.traverse((c) => {
                  c.castShadow = true;
              });
              HexMWall2.position.copy(new THREE.Vector3(-90, 0, 0));

              // Crear la caja de colisión para el modelo animado
              HexMWall_Box2 = new THREE.Box3().setFromObject(HexMWall2);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("HexMWall2.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(HexMWall2);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(HexMWall2);

              //checkCollisions();
          });
      }
      //
      let Pared;
      var Pared_Box;

      function LoadPared() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Pared.fbx", (loadedPared) => {
              Pared = loadedPared;
              Pared.scale.setScalar(0.75);
              Pared.traverse((c) => {
                  c.castShadow = true;
              });
              Pared.position.copy(new THREE.Vector3(-4, 0, 60));

              // Crear la caja de colisión para el modelo animado
              Pared_Box = new THREE.Box3().setFromObject(Pared);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Pared.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(Pared);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(Pared);

              //checkCollisions();
          });
      }
      //
      let Pared2;
      var Pared_Box2;

      function LoadPared2() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Pared2.fbx", (loadedPared2) => {
              Pared2 = loadedPared2;
              Pared2.scale.setScalar(0.75);
              Pared2.traverse((c) => {
                  c.castShadow = true;
              });
              Pared2.position.copy(new THREE.Vector3(78, 0, 0));

              // Crear la caja de colisión para el modelo animado
              Pared_Box2 = new THREE.Box3().setFromObject(Pared2);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Pared2.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(Pared2);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(Pared2);

              //checkCollisions();
          });
      }
      //
      let Pared3;
      var Pared_Box3;

      function LoadPared3() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Pared3.fbx", (loadedPared3) => {
              Pared3 = loadedPared3;
              Pared3.scale.setScalar(0.75);
              Pared3.traverse((c) => {
                  c.castShadow = true;
              });
              Pared3.position.copy(new THREE.Vector3(14, 0, -60));

              // Crear la caja de colisión para el modelo animado
              Pared_Box3 = new THREE.Box3().setFromObject(Pared3);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Pared3.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(Pared3);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(Pared3);

              //checkCollisions();
          });
      }

      //
      let Terminal;
      var Terminal_Box;

      function LoadTerminal() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Terminal.fbx", (loadedTerminal) => {
              Terminal = loadedTerminal;
              Terminal.scale.setScalar(0.55);
              Terminal.traverse((c) => {
                  c.castShadow = true;
              });
              Terminal.position.copy(new THREE.Vector3(0, 0, 0));

              // Crear la caja de colisión para el modelo animado
              Terminal_Box = new THREE.Box3().setFromObject(Terminal);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Terminal.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(Terminal);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(Terminal);

              //checkCollisions();
          });
      }


      //
      let Plane;

      function LoadPlane() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Plane.fbx", (loadedPlane) => {
              Plane = loadedPlane;
              Plane.scale.setScalar(0.55);
              Plane.traverse((c) => {
                  c.castShadow = true;
              });
              Plane.position.copy(new THREE.Vector3(0, 0, 10));

              // Crear la caja de colisión para el modelo animado
              //Plane_Box = new THREE.Box3().setFromObject(Terminal);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Plane.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(Plane);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(Plane);

              //checkCollisions();
          });
      }

      //
      let Edificios;

      function LoadEdificios() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Edificios.fbx", (loadedEdificios) => {
              Edificios = loadedEdificios;
              Edificios.scale.setScalar(0.35);
              Edificios.traverse((c) => {
                  c.castShadow = true;
              });
              Edificios.position.copy(new THREE.Vector3(0, 0, 0));

              // Crear la caja de colisión para el modelo animado
              //Edificios_Box = new THREE.Box3().setFromObject(Edificios);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Edificios.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(Edificios);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();

                  //checkCollisions();
                  animate();
              });

              scene.add(Edificios);

              //checkCollisions();
          });
      }
      //
      let PowerUp1;
      var PowerUp1_Box;

      function LoadPowerUp1() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("PowerUp1.fbx", (loadedPowerUp1) => {
              PowerUp1 = loadedPowerUp1;
              PowerUp1.scale.setScalar(2.0);
              PowerUp1.traverse((c) => {
                  c.castShadow = true;
              });
              PowerUp1.position.copy(new THREE.Vector3(0, 10, -40));

              // Crear la caja de colisión para el modelo animado
              PowerUp1_Box = new THREE.Box3().setFromObject(PowerUp1);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("PowerUp1.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(PowerUp1);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();
                  animate();
              });

              scene.add(PowerUp1);
          });
      }

      function PowerUp_VELOCIDAD_Colission(bbcolision, multiplicadorVel) {
          for (const key in jugadorNames) {
              if (Object.hasOwnProperty.call(jugadorNames, key)) {
                  const jugadorInfo = jugadorNames[key];
                  const jugador = scene.getObjectByName(jugadorInfo.name);

                  if (jugador && jugadorInfo) {
                      const jugadorBB = new THREE.Box3().setFromObject(jugador);

                      if (bbcolision && jugadorBB.intersectsBox(bbcolision)) {
                          jugadoresColisionados++;
                          console.log("Colisión con el jugador:", key);

                          /*// Calcular el vector de retroceso
                          
                          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
                          const construccionPosition = new THREE.Vector3().copy(
                              PowerUp1.position
                          );
                          const retroceso = jugadorPosition
                              .sub(construccionPosition)
                              .normalize()
                              .multiplyScalar(1.5); // Ajusta el valor de retroceso según sea necesario

                          // Retroceder al jugador
                          jugador.position.add(retroceso);*/
                          scene.remove(PowerUp1);
                          velocidadMaxima = velocidadMaxima * multiplicadorVel;
                          velocidadExtra = true

                          setTimeout(function() {
                              velocidadMaxima = velocidadMaxima / multiplicadorVel;
                          }, 3000);

                      }
                  }
              }
          }
      }

      let PowerUpvida;
      var PowerUp1_Vida;

      function LoadPowerUpVida() {
          const loader = new FBXLoader();
          loader.setPath("../assets/FBXmodels/");
          loader.load("Escudo.fbx", (loadedPowerUpVida) => {
              PowerUpvida = loadedPowerUpVida;
              PowerUpvida.scale.setScalar(1.0);
              PowerUpvida.traverse((c) => {
                  c.castShadow = true;
              });
              PowerUpvida.position.copy(new THREE.Vector3(0, 0, 0));

              // Crear la caja de colisión para el modelo animado
              PowerUp1_Vida = new THREE.Box3().setFromObject(PowerUpvida);

              const animLoader = new FBXLoader();
              animLoader.setPath("../assets/FBXmodels/");
              animLoader.load("Escudo.fbx", (anim) => {
                  const mixer = new THREE.AnimationMixer(PowerUpvida);
                  animationMixer.push(mixer);
                  const idleAction = mixer.clipAction(anim.animations[0]);
                  idleAction.play();
                  animate();
              });

              scene.add(PowerUpvida);
          });
      }

      function PowerUp_VIDA_Colission(bbcolision, cantidadVida) {
          for (const key in jugadorNames) {
              if (Object.hasOwnProperty.call(jugadorNames, key)) {
                  const jugadorInfo = jugadorNames[key];
                  const jugador = scene.getObjectByName(jugadorInfo.name);

                  if (jugador && jugadorInfo) {
                      const jugadorBB = new THREE.Box3().setFromObject(jugador);

                      if (bbcolision && jugadorBB.intersectsBox(bbcolision)) {
                          jugadoresColisionados++;
                          console.log("Colisión con el jugador:", key);

                          scene.remove(PowerUpvida);
                          regenerateHealthUserData(jugador.name);

                      }
                  }
              }
          }
      }

      //Función para crear colisiones
      function checkMapColission(objeto, bbColision, retrocesoVar) {
          for (const key in jugadorNames) {
              if (Object.hasOwnProperty.call(jugadorNames, key)) {
                  const jugadorInfo = jugadorNames[key];
                  const jugador = scene.getObjectByName(jugadorInfo.name);

                  if (jugador && jugadorInfo) {
                      const jugadorBB = new THREE.Box3().setFromObject(jugador);

                      if (bbColision && jugadorBB.intersectsBox(bbColision)) {
                          jugadoresColisionados++;
                          console.log("Colisión con el jugador:", key);

                          // Calcular el vector de retroceso
                          const jugadorPosition = new THREE.Vector3().copy(jugador.position);
                          const construccionPosition = new THREE.Vector3().copy(
                              objeto.position
                          );
                          const retroceso = jugadorPosition
                              .sub(construccionPosition)
                              .normalize()
                              .multiplyScalar(retrocesoVar); // Ajusta el valor de retroceso según sea necesario

                          // Retroceder al jugador
                          jugador.position.add(retroceso);
                      }
                  }
              }
          }
      }

      //Carga de modelos
      loadHexWall();
      loadHexWall2();
      loadHexWall3();
      loadHexWall4();
      loadHexWall5();
      LoadBigHex();
      LoadPared();
      LoadPared2();
      LoadPared3();
      LoadTerminal();
      LoadPlane();
      LoadEdificios();
      LoadHexMWall();
      LoadHexMWall2();

      //Carga PowerUps
      LoadPowerUp1();
      LoadPowerUpVida();


      function animate() {
          const deltaTime = clock.getDelta();
          //cube2BB.copy(cube2.geometry.boundingBox).applyMatrix4(cube2.matrixWorld); //Copia la geometría con el matrix4. 
          //console.log(deltaTime);
          const linea = scene.getObjectByName("lineaDisparo");

          for (let i = 0; i < animationMixer.length; i++) {
              animationMixer[i].update(deltaTime);
          }

          trayectoria();

          renderer.render(scene, camera);
          requestAnimationFrame(animate);
          movimiento();
          desacelerar();

          //Colisiones
          checkMapColission(HexWall, Hex_Wall, 1.5)
          checkMapColission(HexWall2, Hex_Wall2, 1.5)
          checkMapColission(HexWall3, Hex_Wall3, 1.5)
          checkMapColission(HexWall4, Hex_Wall4, 1.5)
          checkMapColission(HexWall5, Hex_Wall5, 1.5)
          checkMapColission(BigHex, BigHex_Box, 1.5)
          checkMapColission(Pared, Pared_Box, 1.5)
          checkMapColission(Pared2, Pared_Box2, 1.5)
          checkMapColission(Pared3, Pared_Box3, 1.5)
          checkMapColission(Terminal, Terminal_Box, 1.5)
          checkMapColission(HexMWall, HexMWall_Box, 1.5)
          checkMapColission(HexMWall2, HexMWall_Box2, 1.5)

          //Colisiones de PowerUps
          PowerUp_VELOCIDAD_Colission(PowerUp1_Box, 2);
          PowerUp_VIDA_Colission(PowerUp1_Vida, 50);

          updateBullets();
      }

      function trayectoria() {
          if (hizoLogin) {
              // Draw a line from pointA in the given direction at distance 100
              const jugadorActual = scene.getObjectByName(currentUser.uid);
              const linea = scene.getObjectByName("lineaDisparo");
              pointA = new Float32Array(jugadorActual.position);
              direction = new Float32Array(pointOfIntersection);

              linea.geometry.attributes.position.array[0] = pointA[0];
              linea.geometry.attributes.position.array[1] = pointA[1];
              linea.geometry.attributes.position.array[2] = pointA[2];
              linea.geometry.attributes.position.array[3] = direction[0];
              linea.geometry.attributes.position.array[4] = direction[1];
              linea.geometry.attributes.position.array[5] = direction[2];

              //console.log(linea.geometry.attributes.position.array);
              linea.geometry.attributes.position.needsUpdate = true; // required after the first render
              estado();
          }
      }
      animate();