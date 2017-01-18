// TODO animation subroutines
// gameplay animations
// particles (hero's, fuse, explosions, powerons)

const UNITS = 10;

function createSoftWall() {
	const wallGeometry = new THREE.BoxBufferGeometry(9, 9, 9);
	const wallMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.98, 0.45, 1),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.5,
		reflectivity: 0.5,
		shading: THREE.SmoothShading,
	});

	const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
	wallMesh.position.y = UNITS / 2;

	return wrap(wallMesh); 
}

function wrap(mesh) {
	const object = new THREE.Object3D();
	object.add(mesh); 
	return object;
}


// Floor
function createFloor() {
	const floorGeometry = new THREE.PlaneBufferGeometry(UNITS, UNITS, 1, 1);
	const wallMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.1, 0.85, 0.1),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.5,
		reflectivity: 0.5,
		shading: THREE.SmoothShading,
	});

	const floorMesh = new THREE.Mesh(floorGeometry, wallMaterial);
	floorMesh.rotation.x = -Math.PI / 2;

	return wrap(floorMesh);
}

// Ground
function createGround() {
	const floorGeometry = new THREE.PlaneBufferGeometry(UNITS, UNITS, 1, 1);
	// const
	groundShader = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.45, 0.29, 0.1),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.5,
		reflectivity: 0.5,
		shading: THREE.SmoothShading,
	});

	const floorMesh = new THREE.Mesh(floorGeometry, groundShader);
	floorMesh.rotation.x = -Math.PI / 2;

	return wrap(floorMesh);
}

// Hard Wall
function createHardWall() {
	const wallGeometry = new THREE.BoxBufferGeometry( 9.8, 9.8, 9.8 );
	const hardwallMaterial = new THREE.MeshToonMaterial( {
		color: new THREE.Color().setRGB(0.15, 0.15, .15),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0
	} );

	const hardWall = new THREE.Mesh(wallGeometry, hardwallMaterial);
	hardWall.position.y = UNITS / 2;
	return wrap(hardWall);
}

function createBomb() {
	const bomb = new THREE.Object3D();
	
	const bombMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.15, 0.15, .15),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		// wireframe: true
	});

	const sphereGeometry = new THREE.SphereBufferGeometry(5.2, 12, 12);
	const ball = new THREE.Mesh(sphereGeometry, bombMaterial);
	bomb.add(ball);

	const capGeometry = new THREE.CylinderBufferGeometry( 2.5, 2.5, 1, 12 );
	const cap = new THREE.Mesh(capGeometry, bombMaterial);
	cap.position.y = 5;
	bomb.add(cap);

	const Path = THREE.Curve.create(
		function () {
		},

		function ( t ) { //getPoint: t is between 0-1
			var tx = t; // Math.cos( t ) * 2 * 
			var ty = t * 3.5;
			var tz = Math.sin( t ) * 2 * t;

			return new THREE.Vector3( tx, ty, tz );
		}
	);

	const path = new Path();

	const fuseGeometry = new THREE.TubeBufferGeometry( path, 20, 0.4, 8, false );
	const fuse = new THREE.Mesh(fuseGeometry, bombMaterial);
	fuse.position.y = 5

	bomb.add(fuse);

	bomb.position.y = UNITS / 2;
	bomb.scale.multiplyScalar(0.85);

	return wrap(bomb);
}

function createFlumes() {
	const ballGeometry = new THREE.SphereBufferGeometry(5, 8, 8);
	b = ballGeometry;
	p = ballGeometry.attributes.position.array;
	for (let i = 0; i < p.length; i++) {
		p[i] += (Math.random() - 0.5) * 1;
	}

	ballGeometry.attributes.position.needsUpdate = true;

	// const
	flumesShader = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.95, 0.44, .15),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		wireframe: false,
		transparent: true,
		opacity: 0.85
	});

	ball = new THREE.Mesh(ballGeometry, flumesShader);
	ball.position.y = 5;
	ball.scale.multiplyScalar(1.2);
	return wrap(ball);;
}

function createHero() {
	const man = new THREE.Object3D();

	const headMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.35, 0.15, .95),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		wireframe: false
	});

	// const
	bodyMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.94, 0.43, .2),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		wireframe: false
	});

	var roundedRectShape = new THREE.Shape();
	( function roundedRect( ctx, x, y, width, height, radius ){

		ctx.moveTo( x, y + radius );
		ctx.lineTo( x, y + height - radius );
		ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
		ctx.lineTo( x + width - radius, y + height) ;
		ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
		ctx.lineTo( x + width, y + radius );
		ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
		ctx.lineTo( x + radius, y );
		ctx.quadraticCurveTo( x, y, x, y + radius );

	} )( roundedRectShape, -1, -1, 2, 2, 1 );

	var extrudeSettings = { amount: .6, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: .2, bevelThickness: .2 }
	var headGeometry = new THREE.ExtrudeGeometry( roundedRectShape, extrudeSettings );

	head = new THREE.Mesh(headGeometry, headMaterial);

	tailGeometry = new THREE.SphereBufferGeometry(0.4, 8, 8);
	tail = new THREE.Mesh(tailGeometry, headMaterial);
	tail.position.y = 1;
	tail.position.z = -0.6;
	head.add(tail);

	var faceGeometry = new THREE.CircleBufferGeometry( 3, 12 );

	head.position.z = -0.2;
	head.position.y = 1.9;
	head.scale.y = 0.8;
	face = new THREE.Mesh(faceGeometry, headMaterial);
	face.rotation.y = Math.PI;
	// head.add(face);
	man.add(head);
	man.position.y = 3;

	// Egg formula from http://www.mathematische-basteleien.de/eggcurves.htm
	// x^2 + (1.4 ^ x * 1.6 * y)^2 = 1;
	// (1.4 ^ x * 1.6 * y)^2 = 1 - x^2;
	// 1.4 ^ x * 1.6 * y = Math.pow(1 - x^2, 0.5);
	// y = Math.pow(1 - x^2, 0.5) / (1.4 ^ x * 1.6)

	eggFormula = x => Math.pow(1 - x ** 2, 0.5) / (1.4 ** x * 1.6)

	const divisions = 15;
	const spline = [];
	for (let x = 0; x <= divisions; x++) {
		const t = (x / divisions - 0.5) * 2;
		spline.push(new THREE.Vector2(eggFormula(t), t));
	}

	const bodyGeometry = new THREE.LatheBufferGeometry( spline );
	const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
	const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

	const armGeometry = new THREE.CylinderBufferGeometry( .1, .14, 1.5, 8 );
	arm = new THREE.Mesh(armGeometry, headMaterial);
	arm.position.y = 0.5;
	// arm.position.x = 1;
	arm.rotation.z = Math.PI / 2;

	man.add(arm);

	man.add(body);
	man.scale.multiplyScalar(4);

	return wrap(man);
}