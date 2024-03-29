// TODO animation subroutines
// gameplay animations
// particles (hero's, fuse, explosions, powerons)
// shoes, hands, legs
// simplifyModifier2 / -> Conversion to bufferGeometry.

const UNITS = 10;
var simplyModifer = new THREE.SimplifyModifier();
var subdivisionModifier = new THREE.SubdivisionModifier(2); // loop
var clarkModifier = new THREE.ClarkSubdivisionModifier(3);

GREY = new THREE.Color().setRGB(0.15, 0.15, .15);
BROWN = new THREE.Color().setRGB(0.45, 0.29, 0.1);
PINK = new THREE.Color().setRGB(0.98, 0.45, 1);
HARDWALL_COLOR = new THREE.Color().setStyle(BREW[8]);
SOFTWALL_COLOR = new THREE.Color().setStyle(BREW[4]);
GROUND_COLOR = new THREE.Color().setStyle(BREW[6]);

// new THREE.Color().setRGB(0.98, 0.95, 0.4),
// new THREE.Color().setStyle('#238443'),


function simplify(geometry, target, non) {
	if (!target) {
		target = geometry.vertices.length * 0.2 | 0;
	}

	const reduction = geometry.vertices.length - target;
	// console.log('before', geometry.vertices.length, 'after', target);
	const simplified = simplyModifer.modify(geometry, reduction);
	if (non) return simplified;
	
	return new THREE.BufferGeometry().fromGeometry(simplified);
}

function clarkSubdivide(geometry, subdivisions=3) {
	THREE.computeCentroids(geometry);
	
	clarkModifier.subdivisions = subdivisions;
	clarkModifier.modify(geometry);
	geometry = THREE.convertFace4s(geometry);
	console.log('after box faces', geometry.faces.length);
	return geometry;
}

function subdivide(geometry, subdivisions=3) {
	subdivisionModifier.subdivisions = subdivisions;
	subdivisionModifier.modify(geometry);
	console.log('after box faces', geometry.faces.length);
	return geometry;
}

function createItem(item=0) {
	const wallGeometry = new THREE.BoxBufferGeometry(6, 6, 6);
	const wallMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.95, 0.95, .95),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.9,
		reflectivity: 0.9,
		// shading: THREE.SmoothShading,
		opacity: 0.5,
		transparent: true
	});

	const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
	wallMesh.position.y = UNITS / 2;

	const factory = {
		[0]: () => new THREE.Object3D(),
		[1]: () => createBomb(),
		[2]: () => createFlumes(),
	}
	const b = factory[item]();
	b.scale.multiplyScalar(0.5);
	b.position.y = - UNITS / 4;
	wallMesh.add(b);

	return wrap(wallMesh);
}

function wrap(mesh) {
	const object = new THREE.Object3D();
	object.add(mesh);
	return object;
}

function adjustVertices(geometry, scale=2) {
	const p = geometry.vertices;
	for (let i = 0; i < p.length; i++) {
		p[i].x += (Math.random() - 0.5) * scale;
		p[i].y += (Math.random() - 0.5) * scale;
		p[i].z += (Math.random() - 0.5) * scale;
	}
}

function randomMovePositions(bufferGeometry, scale=1) {
	const p = bufferGeometry.attributes.position.array;
	for (let i = 0; i < p.length; i++) {
		p[i] += (Math.random() - 0.5) * scale;
	}
	bufferGeometry.attributes.position.needsUpdate = true;
}


// Floor
function createFloor(div=1) {
	const floorGeometry = new THREE.PlaneBufferGeometry(UNITS, UNITS, div, div);
	// randomMovePositions(floorGeometry);
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
function createGround(div = 1) {
	const floorGeometry = new THREE.PlaneBufferGeometry(UNITS, UNITS, div, div);
	randomMovePositions(floorGeometry, 0.2);
	// const
	groundShader = new THREE.MeshToonMaterial({
		color: GROUND_COLOR,
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.5,
		reflectivity: 0.5,
		shading: THREE.FlatShading,
		// shading: THREE.SmoothShading,
	});

	const floorMesh = new THREE.Mesh(floorGeometry, groundShader);
	floorMesh.rotation.x = -Math.PI / 2;

	return wrap(floorMesh);
}

// Hard Wall
// Softwall
function createHardWall() {
	const div = 3;
	let wallGeometry = new THREE.BoxGeometry(9.8, UNITS, 9.8, div, div, div);
	wallGeometry.mergeVertices();
	adjustVertices(wallGeometry, 0.5);

	wallGeometry = new THREE.BufferGeometry().fromGeometry(wallGeometry);
	// randomMovePositions(wallGeometry);
	const wallMaterial = new THREE.MeshToonMaterial({
		color: HARDWALL_COLOR,
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.2,
		reflectivity: 0.2,
		shading: THREE.FlatShading,
	});

	const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
	wallMesh.position.y = UNITS / 2;

	return wrap(wallMesh);
}

function createSoftWall() {
	// const wallGeometry = new THREE.BoxBufferGeometry( 9.8, UNITS, 9.8, 3, 3, 3 );
	// randomMovePositions(wallGeometry);

	const wallGeometry = new THREE.BoxBufferGeometry( 7, UNITS / 5, 7, 1, 1, 1 );
	randomMovePositions(wallGeometry, 0.4);

	const hardwallMaterial = new THREE.MeshToonMaterial( {
		color: SOFTWALL_COLOR,
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		wireframe: !true,
	} );

	const hardWall = new THREE.Mesh(wallGeometry, hardwallMaterial);
	hardWall.position.y = UNITS / 2;

	moo = [];
	for (let i =0; i < 2; i++) {
		moo[i] = hardWall.clone();
	}

	for (let i = 0; i < 2; i++) {
		b = moo[i] ;
		b.position.y = UNITS / 4 * (i + 1);
		b.rotation.y = Math.random() * 0.5;
		hardWall.add(b);
	}

	return wrap(hardWall);
}

function createBomb() {
	const bomb = new THREE.Object3D();

	const bombMaterial = new THREE.MeshToonMaterial({
		color: GREY,
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.1,
		reflectivity: 0.1,
		wireframe: !true,
		shading: THREE.FlatShading,
	});

	// const sphereGeometry = new THREE.SphereBufferGeometry(5.2, 12, 12);
	const sphereGeometry = new THREE.OctahedronBufferGeometry(5.2, 2);
	// const sphereGeometry = new THREE.IcosahedronBufferGeometry(5.2, 2);
	// const sphereGeometry = simplify(new THREE.IcosahedronGeometry(5.2, 2), 40);
	
	const ball = new THREE.Mesh(sphereGeometry, bombMaterial);
	bomb.add(ball);

	const capGeometry = new THREE.CylinderBufferGeometry( 2.5, 2.5, 1, 12 );
	const cap = new THREE.Mesh(capGeometry, bombMaterial);
	cap.position.y = 5;
	bomb.add(cap);

	function Path() {}
	Path.prototype = Object.create( THREE.Curve.prototype );
	Path.prototype.constructor = Path;
	Path.prototype.getPoint = function ( t ) { //getPoint: t is between 0-1
		var tx = t; // Math.cos( t ) * 2 *
		var ty = t * 3.5;
		var tz = Math.sin( t ) * 2 * t;

		return new THREE.Vector3( tx, ty, tz );
	}

	const path = new Path();

	// const fuseGeometry = new THREE.TubeBufferGeometry( path, 20, 0.4, 8, false );
	const fuseGeometry = simplify(new THREE.TubeGeometry( path, 20, 0.4, 8, false ));
	const fuse = new THREE.Mesh(fuseGeometry, bombMaterial);
	fuse.position.y = 5

	bomb.add(fuse);

	bomb.position.y = UNITS / 2;
	bomb.scale.multiplyScalar(0.85);

	return wrap(bomb);
}

function createClark() {
	// const
	flumesShader = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.95, 0.44, .15),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		// wireframe: true,
		shading: THREE.FlatShading,
		// transparent: true,
		// opacity: 0.85
	});

	var boxGeo = new THREE.CubeGeometry(7, 7, 5, 2, 2, 2);

	boxGeo = clarkSubdivide(boxGeo);
	boxGeo = simplify(boxGeo, 300);
	// console.log('simplify', boxGeo.faces.length);

	box = new THREE.Mesh(boxGeo, flumesShader);
	box.position.y = 5;
	box.position.z = 6;

	// result.mergeVertices();
	// result = simplify(result, 200);

	return wrap(box);
}

function createCSG(shader) {
	var parts = 1;
	let ballGeometry = 
		new THREE.BoxGeometry(7, 6, 7, parts, parts, parts);
		// new THREE.SphereGeometry(5, 20, 20);
		// new THREE.CubeGeometry(7, 6, 5, parts, parts, parts);
	boxGeo = new THREE.BoxGeometry(7, 6, 7, parts, parts, parts);
	
	// const
	flumesShader = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.95, 0.44, .15),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		// wireframe: true,
		shading: THREE.FlatShading,
		// transparent: true,
		// opacity: 0.85
	});
	if (!shader) shader = flumesShader;

	ball = new THREE.Mesh(ballGeometry, shader);
	ball.position.y = 5;
	ball.scale.multiplyScalar(1.2);
	// ball.scale.y *= 0.4;

	var sphere_bsp = new ThreeBSP( ball );

	var boxGeo =
		new THREE.CubeGeometry(7, 6, 5, parts, parts, parts);
	
	
	box = new THREE.Mesh(boxGeo, shader);
	box.position.y = 5;
	box.position.z = 6.5;


	var box_bsp = new ThreeBSP( box );

	var result = sphere_bsp.subtract(box_bsp).toGeometry();
	// console.log(result);
	
	THREE.mergeVertices( result );
	// THREE.computeCentroids( result );
	// result.computeFaceNormals();
	// result.computeVertexNormals();

	// result = subdivide(result, 1);
	// result = clarkSubdivide(result, 1);
	
	// result = simplify(result, 200);
	
	var mesh = new THREE.Mesh(result, shader);
	mesh.scale.y = 0.9;

	// var mesh = sphere_bsp.subtract(box_bsp).toMesh(shader)
	
	

	return wrap(mesh);
}

function createFlumes() {
	let ballGeometry = new THREE.SphereGeometry(5, 8, 8);
	ballGeometry.mergeVertices();
	
	p = ballGeometry.vertices;
	for (let i = 0; i < p.length; i++) {
		p[i].x += (Math.random() - 0.5) * 2;
		p[i].y += (Math.random() - 0.5) * 2;
		p[i].z += (Math.random() - 0.5) * 2;
	}

	// const
	flumesShader = new THREE.MeshToonMaterial({
		color: new THREE.Color().setRGB(0.95, 0.44, .15),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		wireframe: false,
		shading: THREE.FlatShading,
		transparent: true,
		opacity: 0.85
	});

	ball = new THREE.Mesh(ballGeometry, flumesShader);
	ball.position.y = 5;
	ball.scale.multiplyScalar(1.2);
	return wrap(ball);
}

function createHero(style = 'red', bodyStyle = 'yellow') {
	const man = new THREE.Object3D();

	const headMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color()
			.setRGB(0.35, 0.15, .95)
			.setStyle(style),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		wireframe: !true,
		shading: THREE.FlatShading
	});

	// const
	bodyMaterial = new THREE.MeshToonMaterial({
		color: new THREE.Color()
			.setRGB(0.94, 0.43, .2)
			.setStyle(bodyStyle),
		specular: new THREE.Color().setRGB(1, 1, 1),
		shininess: 0.0,
		reflectivity: 0.0,
		wireframe: !true,
		shading: THREE.FlatShading
	});

	var roundedRectShape = new THREE.Shape();
	function roundedRect( ctx, x, y, width, height, radius ){

		ctx.moveTo( x, y + radius );
		ctx.lineTo( x, y + height - radius );
		ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
		ctx.lineTo( x + width - radius, y + height) ;
		ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
		ctx.lineTo( x + width, y + radius );
		ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
		ctx.lineTo( x + radius, y );
		ctx.quadraticCurveTo( x, y, x, y + radius );

	}
	
	roundedRect(roundedRectShape, -1, -1, 2, 2, 1 );

	var extrudeSettings = { amount: .9, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: .2, bevelThickness: .2 }
	var headGeometry = new THREE.ExtrudeGeometry( roundedRectShape, extrudeSettings );

	// headGeometry = simplify(headGeometry);

	// head = new THREE.Mesh(headGeometry, headMaterial);

	head = createCSG(headMaterial);
	head.scale.set(0.2, 0.2, 0.2);

	tailGeometry = new THREE.SphereBufferGeometry(0.4, 8, 8);
	tail = new THREE.Mesh(tailGeometry, headMaterial);
	tail.position.y = 1;
	tail.position.z = -0.6;
	head.add(tail);

	var faceGeometry = new THREE.CircleBufferGeometry( 3, 12 );

	// head.position.z = -0.2;
	head.position.y = 1.9;
	// head.scale.y = 0.8;

	faceGeometry.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI));
	face = new THREE.Mesh(faceGeometry, headMaterial);
	// face.rotation.y = Math.PI;


	const feet = new THREE.BoxBufferGeometry(0.2, 0.5, 0.2);
	const feet2 = new THREE.Mesh(feet, headMaterial);
	feet2.position.y = -0.5;

	const shoe = new THREE.BoxBufferGeometry(0.3, 0.15, 0.4);
	const shoe2 = new THREE.Mesh(shoe, headMaterial);
	shoe2.position.y = -0.2;


	feet2.add(shoe2);
	feet2.position.x = -0.2;
	man.add(feet2);

	feet3 = feet2.clone();
	feet3.position.x = 0.2;
	man.add(feet3)



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

	let bodyGeometry = new THREE.LatheGeometry( spline ); // Buffer

	adjustVertices(bodyGeometry, 0.05);
	bodyGeometry = simplify(bodyGeometry);
	const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
	const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

	const leftArm = new THREE.Object3D();

	const armGeometry = new THREE.CylinderBufferGeometry( .14, .1, 0.5, 8 );
	arm = new THREE.Mesh(armGeometry, bodyMaterial);
	arm.applyMatrix(new THREE.Matrix4().makeRotationZ( Math.PI / 2));

	// arm.position.y = 0.5;
	// arm.position.x = 1;
	// arm.rotation.z = Math.PI / 2;
	body.scale.y = 0.7;
	body.position.y = 0.4;

	const sphereGeometry = new THREE.SphereBufferGeometry(0.3, 0.4, 0.4); // Buffer
	const hand = new THREE.Mesh(sphereGeometry, headMaterial);
	hand.position.y = 0.4;
	arm.rotation.y = Math.PI / 8;
	// arm.rotation.z = Math.PI / 8;
	arm.position.y = 0.2;
	
	leftArm.add(arm);
	arm.add(hand);

	rightArm = leftArm.clone();

	leftArm.position.x = -.5;
	rightArm.position.x = .5;
	rightArm.rotation.z = Math.PI;
	man.add(leftArm);
	man.add(rightArm);

	man.add(body);
	man.scale.multiplyScalar(5);

	const o = wrap(man);
	o.head = head;
	return o;
}