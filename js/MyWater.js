
/**
 * Author Lovisa Hassler
 * Date: 6 Dec 2016
 * EXPLANATION: Water with blended reflectiontextures and refractiontexture. Ripples using dudv-mapping.
 */

//Honorable mentions and sources
/*****************************************************************
 * ThinMatrix / https://www.youtube.com/user/ThinMatrix : OpenGL water tutorial series
 * Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 * Slayvin / http://slayvin.net : Based on his Mirror.js shader
 * Eric Lengyel / http://www.terathon.com/lengyel/Lengyel-Oblique.pdf : Paper about clipping using oblique frustums
 *****************************************************************/

THREE.ShaderLib[ 'water' ] = {

	uniforms: {
		"mirrorSampler": { value: null },
		"textureMatrixMirror" : { value: new THREE.Matrix4() },
		"textureMatrixRefraction" : { value: new THREE.Matrix4() },
		"refractionSampler": { value: null},
		"dudvMap": { value: null},
		"moveFactor": { value: 0.0}
	},

	vertexShader: [

		"uniform mat4 textureMatrixMirror;",
		"uniform mat4 textureMatrixRefraction;",

		"varying vec4 mirrorCoord;",
		"varying vec4 refCoord;",
		"varying vec4 textureCoord;",
		

		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			"mirrorCoord = textureMatrixMirror * worldPosition;",
			"refCoord =   textureMatrixRefraction * worldPosition;",

			"gl_Position = projectionMatrix * mvPosition;",


		"}"

	].join( "\n" ),

	fragmentShader: [


		"varying vec4 mirrorCoord;",
		"varying vec4 refCoord;",

		"uniform sampler2D mirrorSampler;",
		"uniform sampler2D refractionSampler;",
		"uniform sampler2D dudvMap;",

		"const float waveStrength = 2.0;",
		"uniform float moveFactor;",


		"void main() {",


			"vec4 moveVec1 = vec4(moveFactor, 0,0,0);",
			"vec4 moveVec2 = vec4(-moveFactor, moveFactor + moveFactor ,0,0);",

			"vec4 distortionMirror = texture2DProj(dudvMap, mirrorCoord + moveVec2) * waveStrength;",
			"vec4 distortionRef = texture2DProj(dudvMap, refCoord+ moveVec1) * waveStrength;",

			"vec4 distMirrorCoord = mirrorCoord + distortionMirror;",
			"vec4 distRefCoord = refCoord + distortionRef;",

			"vec4 colorMirror = texture2DProj(mirrorSampler, distMirrorCoord);",
			"vec4 colorRef = texture2DProj(refractionSampler, distRefCoord );",

			"colorRef = vec4(colorRef.r, colorRef.g, colorRef.b, 1.0);",
			"colorMirror = vec4(colorMirror.r, colorMirror.g, colorMirror.b, 1.0);",

			"vec4 colorWater = mix(colorMirror,colorRef, 0.5);",
			"colorWater = mix(colorWater,vec4(0.0,0.3,0.5,1.0), 0.1);",

			"gl_FragColor = colorWater;",

		"}"

	].join( "\n" )

};

THREE.Water = function ( renderer, camera, options ) {

	THREE.Object3D.call( this );

	this.name = 'water_' + this.id;

	options = options || {};

	this.matrixNeedsUpdate = true;

	var width = options.textureWidth !== undefined ? options.textureWidth : 512;
	var height = options.textureHeight !== undefined ? options.textureHeight : 512;

	this.clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
	this.waveSpeed = options.waveSpeed !== undefined ? options.waveSpeed : 0.003;


	this.renderer = renderer;
	this.waterPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
	this.clipPlane = new THREE.Vector4();
	
	this.time = 0.0;
	this.rippleMoveFactor = 0.0;


	if ( camera instanceof THREE.PerspectiveCamera ) {
		this.camera = camera;
	} else {
		this.camera = new THREE.PerspectiveCamera();
		console.log( this.name + ': camera is not a Perspective Camera!' );
	}
	//Creates texture matrix 
	this.textureMatrixMirror = new THREE.Matrix4();
	this.textureMatrixRefraction = new THREE.Matrix4();

	//CAMERA cloning
	this.mirrorCamera = this.camera.clone();
	this.mirrorCamera.matrixAutoUpdate = true;
	this.refractionCamera = this.camera.clone();
	this.refractionCamera.matrixAutoUpdate = true;

	//Create render target and parameters to render to texture
	var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

	this.renderTargetReflection = new THREE.WebGLRenderTarget( width, height, parameters );
	this.renderTargetRefraction = new THREE.WebGLRenderTarget( width, height, parameters );

	//Create the shader and shader materials
	var waterShader = THREE.ShaderLib[ "water" ];
	var waterUniforms = THREE.UniformsUtils.clone( waterShader.uniforms );

	this.material = new THREE.ShaderMaterial( {

		fragmentShader: waterShader.fragmentShader,
		vertexShader: waterShader.vertexShader,
		uniforms: waterUniforms,

	} );
	//Set all the necessary uniforms
	this.material.uniforms.mirrorSampler.value = this.renderTargetReflection.texture;
	this.material.uniforms.refractionSampler.value = this.renderTargetRefraction.texture;

	this.material.uniforms.textureMatrixMirror.value = this.textureMatrixMirror;
	this.material.uniforms.textureMatrixRefraction.value = this.textureMatrixRefraction;

	this.material.uniforms.dudvMap.value = new THREE.TextureLoader().load('textures/mapping/dudvmap.png');



	if ( ! THREE.Math.isPowerOfTwo( width ) || ! THREE.Math.isPowerOfTwo( height ) ) {

		this.renderTargetReflection.texture.generateMipmaps = false;
		this.renderTargetRefraction.texture.generateMipmaps = false;
	}

	this.updateTextureMatrices();        

	this.render();
};

THREE.Water.prototype = Object.create( THREE.Object3D.prototype );
THREE.Water.prototype.constructor = THREE.Water;


THREE.Water.prototype.updateTextureMatrices = function () {

	//update
	this.updateMatrixWorld();
	this.camera.updateMatrixWorld();
	//copy values from world and camera
	this.mirrorWorldPosition.setFromMatrixPosition( this.matrixWorld );
	this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

	this.rotationMatrix.extractRotation( this.matrixWorld );
	//set normal
	this.normal.set( 0, 0, 1 );
	this.normal.applyMatrix4( this.rotationMatrix );
 	//new view
	var view = this.mirrorWorldPosition.clone().sub( this.cameraWorldPosition );
	view.reflect( this.normal ).negate();	//WHAT HAPPENS HERE??
	view.add( this.mirrorWorldPosition );

	this.rotationMatrix.extractRotation( this.camera.matrixWorld );
	//set lookat
	this.lookAtPosition.set( 0, 0, -1 );
	this.lookAtPosition.applyMatrix4( this.rotationMatrix );
	this.lookAtPosition.add( this.cameraWorldPosition );

	//set new target
	var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition ); //subtracts lookAtPos from mirrorWorldPos
	target.reflect( this.normal ).negate(); 
	target.add( this.mirrorWorldPosition ); //additions mirrorworldposition

	this.up.set( 0, -1, 0 );  
	this.up.applyMatrix4( this.rotationMatrix );
	this.up.reflect( this.normal ).negate();

	//mirrorcamera copies values
	this.mirrorCamera.position.copy( view );
	this.mirrorCamera.up = this.up;
	this.mirrorCamera.lookAt( target );

	this.mirrorCamera.updateProjectionMatrix();
	this.mirrorCamera.updateMatrixWorld();
	this.mirrorCamera.matrixWorldInverse.getInverse( this.mirrorCamera.matrixWorld );

	//refractionCamera copies values from the regular camera
	this.refractionCamera.position.copy( this.camera.position );
	this.refractionCamera.projectionMatrix.copy( this.camera.projectionMatrix );
	this.refractionCamera.rotation.copy( this.camera.rotation );

	this.refractionCamera.updateProjectionMatrix();
	this.refractionCamera.updateMatrixWorld();
	this.refractionCamera.matrixWorldInverse.getInverse( this.camera.matrixWorld );

	// Update both the texture matrices
	this.textureMatrixMirror.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );

	this.textureMatrixMirror.multiply( this.mirrorCamera.projectionMatrix ); 
	this.textureMatrixMirror.multiply( this.mirrorCamera.matrixWorldInverse ); 

	this.textureMatrixRefraction.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );

	this.textureMatrixRefraction.multiply( this.refractionCamera.projectionMatrix ); 
	this.textureMatrixRefraction.multiply( this.refractionCamera.matrixWorldInverse ); 


	// Now update projection matrix with new clip plane
	this.waterPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
	this.waterPlane.applyMatrix4( this.mirrorCamera.matrixWorldInverse );

	this.applyClipping(this.mirrorCamera, this.waterPlane);
	this.applyClipping(this.refractionCamera, this.waterPlane);

};

THREE.Water.prototype.render = function () {

	if ( this.matrixNeedsUpdate ){
		this.calculateRippleMoveFactor();
		this.updateTextureMatrices();
	}

	this.matrixNeedsUpdate = true;


	var scene = this;

	while ( scene.parent !== null ) {

		scene = scene.parent;

	}

	if ( scene !== undefined && scene instanceof THREE.Scene ) {

		// We can't render ourself to ourself
		var visible = this.material.visible;
		this.material.visible = false;
		// Render the mirrored view and refraction of the current scene into the target textures
		this.renderer.render( scene, this.refractionCamera, this.renderTargetRefraction, true );

		this.renderer.render( scene, this.mirrorCamera, this.renderTargetReflection, true );

		this.material.visible = visible;

	}


};

// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf

THREE.Water.prototype.applyClipping = function (aCamera, aClipPlane) {

	this.clipPlane.set( aClipPlane.normal.x, aClipPlane.normal.y, aClipPlane.normal.z, aClipPlane.constant );

	var q = new THREE.Vector4();
	var projectionMatrix = aCamera.projectionMatrix;

	q.x = ( Math.sign( this.clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
	q.y = ( Math.sign( this.clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
	q.z = - 1.0;
	q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

	// Calculate the scaled plane vector
	var c = new THREE.Vector4();
	c = this.clipPlane.multiplyScalar( 2.0 / this.clipPlane.dot( q ) );

	// Replacing the third row of the projection matrix
	projectionMatrix.elements[ 2 ] = c.x;
	projectionMatrix.elements[ 6 ] = c.y;
	projectionMatrix.elements[ 10 ] = c.z + 1.0 - this.clipBias;
	projectionMatrix.elements[ 14 ] = c.w;

	return aCamera;
 	};


 	THREE.Water.prototype.calculateRippleMoveFactor = function () {

 			//calculate moveFactor
	this.time += 1.0 / 60.0;
	this.time - Math.PI/2
	this.rippleMoveFactor += this.time * this.waveSpeed;
	this.rippleMoveFactor = (Math.sin(this.time) ) * 10 + 5* Math.cos(this.time);
	this.material.uniforms.moveFactor.value = this.rippleMoveFactor;



 	};
