 //-------------VARIABLES-------------------
var waterMesh, mainRenderer, scene, camera, waterSurface, controls;

 //-------------FUNCTIONS-------------------

init = function() {

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 0;
  camera.position.y = 350;
  camera.position.x = -200;

  scene = new THREE.Scene();

  
  addLights();
  loadBathtub();
  loadSkyBoxAndFloor();
  loadWater();
 
  //navigate in scene
  controls = new THREE.OrbitControls(camera);
  mainRenderer = new THREE.WebGLRenderer();

  //Update viewport window and update if window is resized
  updateViewport();
  window.addEventListener('resize', updateViewport); 


  return document.body.appendChild(mainRenderer.domElement);
};


updateViewport = function() {
    mainRenderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    return controls.target.set(0, 0, 0);
};

animate = function() {
  //var dt;
  //dt = Date.now() - now; // tidsskillnad

  requestAnimationFrame(animate);
  mainRenderer.render(scene, camera);
  controls.update();

  //return now = Date.now();
}; 


loadWater= function(){
  //Storlek på vattenytan
  var W = 290;
  var H = 590;

  //Upplösning på vattenytan
  var NH = 1; 
  var NW = 1;

  //Planet som är vattenytan
  waterSurface = new THREE.PlaneGeometry(W, H, NW, NH);

  //material and mesh
  var materials = new THREE.MeshPhongMaterial({ color: 0x006080, specular: 0x101010, opacity: 0.7, transparent: true, wireframe : false});
  waterMesh = new THREE.Mesh(waterSurface, materials);
  scene.add(waterMesh);

  //matrisen som appliceras på vattenytan
  var matrix = new THREE.Matrix4();
  matrix.makeRotationX(-Math.PI / 2);
  waterSurface.applyMatrix(matrix);
}


addLights= function(){
 //-------------LJUS-------------------
  var lightamb = new THREE.AmbientLight( 0x909090 ); // soft white light
  scene.add( lightamb );

  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( 100, 1000, 100 );

  spotLight.castShadow = true;

  spotLight.shadowMapWidth = 1024;
  spotLight.shadowMapHeight = 1024;

  spotLight.shadowCameraNear = 500;
  spotLight.shadowCameraFar = 4000;
  spotLight.shadowCameraFov = 30;

  scene.add( spotLight );
};

loadBathtub = function(){


 //-------------BADKARET-------------------
  var bathMaterialcolor = new THREE.MeshLambertMaterial({ color: 0xff0000});

  //-----kortsida material--------
  var texture1 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture1.wrapS = THREE.RepeatWrapping;
  texture1.wrapT = THREE.RepeatWrapping;
  texture1.repeat.set( 1, 4); //sidor

  var texture2 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture2.wrapS = THREE.RepeatWrapping;
  texture2.wrapT = THREE.RepeatWrapping;
  texture2.repeat.set( 5, 1 ); // ovan- och undersida

  var texture3 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture3.wrapS = THREE.RepeatWrapping;
  texture3.wrapT = THREE.RepeatWrapping;
  texture3.repeat.set( 7, 4 ); //in och utsida

  var bathMaterial1 = new THREE.MeshLambertMaterial( { map: texture1 } );
  var bathMaterial2 = new THREE.MeshLambertMaterial( { map: texture2 } );
  var bathMaterial3 = new THREE.MeshLambertMaterial( { map: texture3 } );

  // utsida, insida, ovan, under, kort-fram, kort-bort
  var materials = [bathMaterial1, bathMaterial1, bathMaterial2, bathMaterial2, bathMaterial3, bathMaterial3];

  var bathMaterial = new THREE.MeshFaceMaterial( materials); 
  //----slut kortsida material---------

  //sida ett
  var bathGeometryShort = new THREE.BoxGeometry (299, 200, 20);
  bathGeometryShort.applyMatrix( new THREE.Matrix4().makeTranslation(0, -80, -300) );
  var bathShortSideOne = new THREE.Mesh(bathGeometryShort, bathMaterial);
  scene.add(bathShortSideOne);

  //sida två
  var bathGeometryShortTwo = new THREE.BoxGeometry (299, 200, 20);
  bathGeometryShortTwo.applyMatrix( new THREE.Matrix4().makeTranslation(0, -80, 300) );
  var bathShortSideTwo = new THREE.Mesh(bathGeometryShortTwo, bathMaterial);
  scene.add(bathShortSideTwo);

    //-----långsida material-----
  var texture4 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture4.wrapS = THREE.RepeatWrapping;
  texture4.wrapT = THREE.RepeatWrapping;
  texture4.repeat.set( 15, 1 ); //ovan, under

  var texture5 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture5.wrapS = THREE.RepeatWrapping;
  texture5.wrapT = THREE.RepeatWrapping;
  texture5.repeat.set( 1, 8 ); //sidor

  var texture6 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture6.wrapS = THREE.RepeatWrapping;
  texture6.wrapT = THREE.RepeatWrapping;
  texture6.repeat.set( 15, 4 ); //långsida-långsida!

  var bathMaterial4 = new THREE.MeshLambertMaterial( { map: texture4 } );
  var bathMaterial5 = new THREE.MeshLambertMaterial( { map: texture5 } );
  var bathMaterial6 = new THREE.MeshLambertMaterial( { map: texture6 } );

  // [kortsida-vänster, kortsida-höger, ovansida, undersida, lång-långsida-in, lång-långsida-ut]
  var materials2 = [bathMaterial5, bathMaterial5, bathMaterial4, bathMaterial4, bathMaterial6, bathMaterial6];

  var bathMaterial2 = new THREE.MeshFaceMaterial( materials2 ); 
  //----slut långsida material-------

  //sida tre
  var bathGeometryLong = new THREE.BoxGeometry (620, 200, 20);
  bathGeometryLong.translate(0, -80, -150);
  var matrix = new THREE.Matrix4();
  matrix.makeRotationY(Math.PI / 2);
  bathGeometryLong.applyMatrix( matrix );
  var bathShortSideThree = new THREE.Mesh(bathGeometryLong, bathMaterial2);
  scene.add(bathShortSideThree);

  //sida fyra
  var bathGeometryLongTwo = new THREE.BoxGeometry (620, 200, 20);
  bathGeometryLongTwo.translate(0, -80, 150);
  var matrix2 = new THREE.Matrix4();
  matrix2.makeRotationY(Math.PI / 2);
  bathGeometryLongTwo.applyMatrix( matrix2 );
  var bathShortSideFour = new THREE.Mesh(bathGeometryLongTwo, bathMaterial2);
  scene.add(bathShortSideFour);

  //----botten material---------
  var texture7 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture7.wrapS = THREE.RepeatWrapping;
  texture7.wrapT = THREE.RepeatWrapping;
  texture7.repeat.set( 1, 1 ); 

  var texture8 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture8.wrapS = THREE.RepeatWrapping;
  texture8.wrapT = THREE.RepeatWrapping;
  texture8.repeat.set( 5, 15 ); 

  var texture9 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture9.wrapS = THREE.RepeatWrapping;
  texture9.wrapT = THREE.RepeatWrapping;
  texture9.repeat.set( 1, 1 ); //in och utsida

  var bathMaterial7 = new THREE.MeshLambertMaterial( { map: texture7 } );
  var bathMaterial8 = new THREE.MeshLambertMaterial( { map: texture8 } );
  var bathMaterial9 = new THREE.MeshLambertMaterial( { map: texture9 } );

  var materials3 = [bathMaterial7, bathMaterial7, bathMaterial8, bathMaterial8, bathMaterial9, bathMaterial9];

  var bathMaterial3 = new THREE.MeshFaceMaterial( materials3 ); 
  //------slut botten materal-------

  // botten
  var bathGeometryBottom = new THREE.BoxGeometry(299, 20, 620);
  bathGeometryBottom.translate(0, -170, 0);
  var bathBottom = new THREE.Mesh(bathGeometryBottom, bathMaterial3);
  scene.add(bathBottom);

  //-------------TRAPPSTEG-------------------
  //-----trappsteg material-------
  var texture10 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture10.wrapS = THREE.RepeatWrapping;
  texture10.wrapT = THREE.RepeatWrapping;
  texture10.repeat.set( 4, 1 ); 

  var texture11 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture11.wrapS = THREE.RepeatWrapping;
  texture11.wrapT = THREE.RepeatWrapping;
  texture11.repeat.set( 4, 1 ); 

  var texture12 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture12.wrapS = THREE.RepeatWrapping;
  texture12.wrapT = THREE.RepeatWrapping;
  texture12.repeat.set( 4, 2 ); //in och utsida

  var bathMaterial10 = new THREE.MeshLambertMaterial( { map: texture10 } );
  var bathMaterial11 = new THREE.MeshLambertMaterial( { map: texture11 } );
  var bathMaterial12 = new THREE.MeshLambertMaterial( { map: texture12 } );

  var materials4 = [bathMaterial10, bathMaterial10, bathMaterial11, bathMaterial11, bathMaterial12, bathMaterial12];

  var bathMaterial4 = new THREE.MeshFaceMaterial( materials4 ); 
  //------slut trappsteg material-----

  var stepOneGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepOneGeometry.translate(0, -35, 260);
  var stepOne = new THREE.Mesh(stepOneGeometry, bathMaterial4);
  scene.add(stepOne);

  var stepTwoGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepTwoGeometry.translate(0, -73, 200);
  var stepTwo = new THREE.Mesh(stepTwoGeometry, bathMaterial4);
  scene.add(stepTwo);

  var stepThreeGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepThreeGeometry.translate(0, -109, 140);
  var stepThree = new THREE.Mesh(stepThreeGeometry, bathMaterial4);
  scene.add(stepThree);

  var stepFourGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepFourGeometry.translate(0, -147, 80);
  var stepFour = new THREE.Mesh(stepFourGeometry, bathMaterial4);
  scene.add(stepFour);
  //--------------------------------------------

};

loadSkyBoxAndFloor = function(){
 //----------SKYBOX---------------------
  // code from http://stemkoski.github.io/Three.js/Skybox.html
        var imagePrefix = "textures/heaven/";
        var directions  = ["right", "left", "top", "down", "front", "back"];
        var imageSuffix = ".png";
        var skyGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 ); 
        
        // create array for images to skybox
        var materialArray = [];
        for (var i = 0; i < 6; i++)
          materialArray.push( new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
            side: THREE.BackSide
          }));
        var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
        
        // testing variable for test without textures
        //var himmelmaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.BackSide } );
        var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
        scene.add( skyBox );


  //----------FLOOR---------------------
  var floor1 = new THREE.PlaneGeometry(10000, 7000);
  //matrisen som appliceras på golvet
  //var matrix = new THREE.Matrix4();
  //matrix.makeRotationX(-Math.PI / 2);
  floor1.applyMatrix(new THREE.Matrix4().makeTranslation(5160,3190,0));
  floor1.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  var floorTex = new THREE.TextureLoader().load("textures/floortiles.jpg");
  floorTex.wrapS = THREE.reapeatWrapping; 
  floorTex.wrapT = THREE.reapeatWrapping; 
  floorTex.repeat.set(7,7); 

   //material och mesh
  var floorMat = new THREE.MeshBasicMaterial( {map: floorTex, side: THREE.DoubleSide} );
  floorMesh1 = new THREE.Mesh(floor1, floorMat);
  scene.add(floorMesh1);


  var floor2 = new THREE.PlaneGeometry(7000, 7000);
  floor2.applyMatrix(new THREE.Matrix4().makeTranslation(-3340,3810,0));
  floor2.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
   //material och mesh
  floorMesh2 = new THREE.Mesh(floor2, floorMat);
  scene.add(floorMesh2);

  var floor3 = new THREE.PlaneGeometry(7000, 7000);
  floor3.applyMatrix(new THREE.Matrix4().makeTranslation(-3660,-3190,0));
  floor3.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
   //material och mesh
  floorMesh3 = new THREE.Mesh(floor3, floorMat);
  scene.add(floorMesh3);

  var floor4 = new THREE.PlaneGeometry(7000, 7000);
  floor4.applyMatrix(new THREE.Matrix4().makeTranslation(3340,-3810,0));
  floor4.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
   //material och mesh
  floorMesh4 = new THREE.Mesh(floor4, floorMat);
  scene.add(floorMesh4);

};


 //----------CALL THE MOST IMPORTANT FUNCTIONS----------------

init();

animate();
