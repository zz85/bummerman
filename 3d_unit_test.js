var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var geometry = new THREE.BoxBufferGeometry( 10, 10, 10 );
var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
var cube = new THREE.Mesh( geometry, material );
var boxHelper = new THREE.BoxHelper( cube )

var pointLight = new THREE.PointLight( 0xffffff );
scene.add(pointLight);

const platform = new THREE.Object3D();

scene.add(platform);

boxHelper.position.y = UNITS / 2;
platform.add(boxHelper);

// var dlight = new THREE.DirectionalLight();

items = [
    createClark(),
    createCSG(),
    createHero(),
    createItem(),
    createBomb(),
    createFlumes(),
    createSoftWall(),
    createFloor(),
    createGround(),
    createHardWall(),
];

index = 0;

function next() {
    items.forEach(i => platform.remove(i));
    platform.add(items[index % items.length]);
    index++;
}

next();

document.body.addEventListener('mousedown', next);
document.body.addEventListener('keypress', next);


camera.position.x = 10;
camera.position.y = UNITS * 1.2;
camera.position.z = 15;
pointLight.position.set(15, 5, 15);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

animate();

function animate() {
    requestAnimationFrame(animate);

    render();
}

function render() {
    platform.rotation.y += 0.01;

    n = Date.now() / 1000 * 4;
    head.rotation.y = Math.sin(n) * 0.4;

    n = Date.now() / 1000 * 1;
    head.rotation.x = Math.sin(n) * 0.2;


    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}
