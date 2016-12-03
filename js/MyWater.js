
/**
 * Author Lovisa Hassler
 Water with reflection, refraction and ripples using dudv-mapping.
 */


//Based on Mirror.js written by
/**
 * @author Slayvin / http://slayvin.net
 */

THREE.ShaderLib[ 'water' ] = {

	uniforms: {
		"mirrorSampler": { value: null },
		"textureMatrixMirror" : { value: new THREE.Matrix4() },
		"textureMatrixRefraction" : { value: new THREE.Matrix4() },
		"refractionSampler": { value: null} 
	},

	vertexShader: [

		"uniform mat4 textureMatrixMirror;",

		"uniform mat4 textureMatrixRefraction;",

		"varying vec4 waterCoord;",

		"varying vec4 refCoord;",


		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			"waterCoord = textureMatrixMirror * worldPosition;",
			"refCoord =   textureMatrixRefraction * worldPosition;",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform sampler2D mirrorSampler;",

		"uniform sampler2D refractionSampler;",

		"varying vec4 waterCoord;",

		"varying vec4 refCoord;",


		"void main() {",

			"vec4 colorMirror = texture2DProj(mirrorSampler, waterCoord);",

			"vec4 colorRef = texture2DProj(refractionSampler, refCoord);",

			"colorRef = vec4(colorRef.r, colorRef.g, colorRef.b, 1.0);",

			"colorMirror = vec4(colorMirror.r, colorMirror.g, colorMirror.b, 1.0);",

			"vec4 colorWater = mix(colorMirror,colorRef, 0.5);",

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

	this.renderer = renderer;
	this.waterPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
	this.clipPlane = new THREE.Vector4();


/*	// For debug only, show the normal and plane of the mirror
	var debugMode = options.debugMode !== undefined ? options.debugMode : false;

	if ( debugMode ) {

		var arrow = new THREE.ArrowHelper( new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0, 0 ), 10, 0xffff80 );
		var planeGeometry = new THREE.Geometry();
		planeGeometry.vertices.push( new THREE.Vector3( - 10, - 10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( 10, - 10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( 10, 10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( - 10, 10, 0 ) );
		planeGeometry.vertices.push( planeGeometry.vertices[ 0 ] );
		var plane = new THREE.Line( planeGeometry, new THREE.LineBasicMaterial( { color: 0xffff80 } ) );

		this.add( arrow );
		this.add( plane );

	}
*/
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

	this.material.uniforms.mirrorSampler.value = this.renderTargetReflection.texture;
	this.material.uniforms.refractionSampler.value = this.renderTargetRefraction.texture;

	this.material.uniforms.textureMatrixMirror.value = this.textureMatrixMirror;
		this.material.uniforms.textureMatrixRefraction.value = this.textureMatrixRefraction;


	if ( ! THREE.Math.isPowerOfTwo( width ) || ! THREE.Math.isPowerOfTwo( height ) ) {

		this.renderTargetReflection.texture.generateMipmaps = false;
		this.renderTargetRefraction.texture.generateMipmaps = false;
	}

	this.updateTextureMatrixMirror();

	this.render();
};

THREE.Water.prototype = Object.create( THREE.Object3D.prototype );
THREE.Water.prototype.constructor = THREE.Water;


THREE.Water.prototype.updateTextureMatrixMirror = function () {

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
	var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition );
	target.reflect( this.normal ).negate(); 
	target.add( this.mirrorWorldPosition );

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

	// Update the texture matrices
	this.textureMatrixMirror.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );

	this.textureMatrixMirror.multiply( this.mirrorCamera.projectionMatrix ); 
	this.textureMatrixMirror.multiply( this.mirrorCamera.matrixWorldInverse ); 

	this.textureMatrixRefraction.set( -0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );

	this.textureMatrixRefraction.multiply( this.mirrorCamera.projectionMatrix ); 
	this.textureMatrixRefraction.multiply( this.mirrorCamera.matrixWorldInverse ); 


	// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
	// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
	this.waterPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
	this.waterPlane.applyMatrix4( this.mirrorCamera.matrixWorldInverse );

	this.clipPlane.set( this.waterPlane.normal.x, this.waterPlane.normal.y, this.waterPlane.normal.z, this.waterPlane.constant );

	var q = new THREE.Vector4();
	var projectionMatrix = this.mirrorCamera.projectionMatrix;

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

};

THREE.Water.prototype.render = function () {

	if ( this.matrixNeedsUpdate ) this.updateTextureMatrixMirror();

	this.matrixNeedsUpdate = true;

	// Render the mirrored view of the current scene into the target texture
	var scene = this;

	while ( scene.parent !== null ) {

		scene = scene.parent;

	}

	if ( scene !== undefined && scene instanceof THREE.Scene ) {

		// We can't render ourself to ourself
		var visible = this.material.visible;
		this.material.visible = false;
		this.renderer.render( scene, camera, this.renderTargetRefraction, true );

		this.renderer.render( scene, this.mirrorCamera, this.renderTargetReflection, true );

		this.material.visible = visible;

	}

};


/* only necessary if you use two mirrors
THREE.Mirror.prototype.renderWithMirror = function ( otherMirror ) {

	// update the mirror matrix to mirror the current view
	this.updateTextureMatrix();
	this.matrixNeedsUpdate = false;

	// set the camera of the other mirror so the mirrored view is the reference view
	var tempCamera = otherMirror.camera;
	otherMirror.camera = this.mirrorCamera;

	// render the other mirror in temp texture
	otherMirror.renderTemp();
	otherMirror.material.uniforms.mirrorSampler.value = otherMirror.renderTarget2.texture;

	// render the current mirror
	this.render();
	this.matrixNeedsUpdate = true;

	// restore material and camera of other mirror
	otherMirror.material.uniforms.mirrorSampler.value = otherMirror.renderTarget.texture;
	otherMirror.camera = tempCamera;

	// restore texture matrix of other mirror
	otherMirror.updateTextureMatrix();

};*/
/*
THREE.Mirror.prototype.renderTemp = function () {

	if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();

	this.matrixNeedsUpdate = true;

	// Render the mirrored view of the current scene into the target texture
	var scene = this;

	while ( scene.parent !== null ) {

		scene = scene.parent;

	}

	if ( scene !== undefined && scene instanceof THREE.Scene ) {

		this.renderer.render( scene, this.mirrorCamera, this.renderTarget2, true );

	}

};*/