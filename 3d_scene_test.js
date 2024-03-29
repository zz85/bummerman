let dist = 15;
let angle = 0.35; // 0 for top down, 1, for isometric

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.setFocalLength(35);
var geometry = new THREE.BoxBufferGeometry( 10, 10, 10 );
var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
var cube = new THREE.Mesh( geometry, material );
var boxHelper = new THREE.BoxHelper( cube )

var pointLight = new THREE.PointLight( 0xffffff );
scene.add(pointLight);

const platform = new THREE.Object3D();

scene.add(platform);

// var dlight = new THREE.DirectionalLight();

softWall = createSoftWall();
floor = createFloor();
// floor.scale.multiplyScalar(2);

hardWall = createHardWall();
bomb = createBomb();
hero = createHero();

items = [
    createItem(),
    createFlumes(),
    softWall,
    floor,
    hardWall,
    hero
];

function positionAt(x, y, item) {
    rx = (x - 6) * UNITS;
    ry = (y - 6) * UNITS;

    i = createFloor();
    // i = createFlumes();
    i.position.x = rx;
    i.position.z = ry;

    platform.add(i);

    i = window['create' + item[0].toUpperCase() + item.slice(1)]()
    i.position.x = rx;
    i.position.z = ry;
    platform.add(i);

}

randoms = 'SoftWall,Floor,HardWall,Flumes,Bomb,Hero,Ground'.split(',');
for (y = 0; y < 12; y++) {
    for (x = 0; x < 12; x++) {
        positionAt(x, y, randoms[Math.random() * randoms.length | 0]);
    }
}


// camera.position.x = 10;
// camera.position.y = UNITS * 1.2;
// camera.position.z = 15;
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
    // platform.rotation.y += 0.001;
    camera.position.y = UNITS * dist;
    camera.position.z = UNITS * dist * angle;

    n = Date.now() / 1000 * 4;
    head.rotation.y = Math.sin(n) * 0.4;
    n = Date.now() / 1000 * 1;
    head.rotation.x = Math.sin(n) * 0.2;

    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}
