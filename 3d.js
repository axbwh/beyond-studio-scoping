import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import svg from './icon.svg'
import glb from './icon.glb'

const vs = `
varying vec4 mvPosition;
varying mat3 vNormalMatrix;
varying mat4 mvMatrix;
varying vec2 vUv;
void main()
{
  // is a predefined vertex attribute (see WebGLProgram)
  vNormalMatrix =  normalMatrix;
  mvMatrix = modelViewMatrix;
  mvPosition = modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
  gl_Position = projectionMatrix * mvPosition;
}`

const fs = `
varying vec2 vUv;
void main()
{

    vec2 uv = vUv;

    vec2 uvn=abs(uv-0.5)*2.0;

    vec2 distV     = uvn;
    float maxDist  = max(abs(distV.x), abs(distV.y));
    float circular = length(distV);
    float square   = maxDist;
    float mix = mix(circular,square,maxDist);
    mix = smoothstep(0.1, 1.0, mix);
    gl_FragColor = vec4(mix, 1.0, 0.0, 1.0);
}`



class ThreeD {
    constructor(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.canvas = this.renderer.domElement
        this.canvas.setAttribute('data-sampler', 'threeDTexture')

        this.material = new THREE.ShaderMaterial({
            vertexShader : vs,
            fragmentShader: fs,
            side : THREE.DoubleSide
        })
        this.scale = 5;

        this.camera.position.z = 10;
        this.mouse = { x : 0.5, y: 0.5};
        window.addEventListener( 'resize', this.onWindowResize );
        // document.body.appendChild( this.renderer.domElement );

    }

    loadSvg(){
        const loader = new SVGLoader();
        return loader.loadAsync(svg).then((data) => {
        const shape = SVGLoader.createShapes(data.paths[0])[0]; // create a shape from the first svg path
        
        this.geometry = new THREE.ShapeGeometry(shape)
        this.mesh = new THREE.Mesh(this.geometry, this.material)
		this.scene.add( this.mesh );
        //this.mesh.rotation.z = Math.PI / 4 ;
        this.ready()
        })
    }

    loadGlb(){
        // Instantiate a loader
        const loader = new GLTFLoader();

        // Optional: Provide a DRACOLoader instance to decode compressed mesh data
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader( dracoLoader );

        return loader.loadAsync(glb).then((glb) => {
            console.log(glb.scene.children[0].geometry)
            this.geometry = glb.scene.children[0].geometry
            this.mesh = new THREE.Mesh(this.geometry, this.material)
            this.scene.add( this.mesh );
            this.mesh.rotation.x = Math.PI / 4 ;
            this.ready()
        })

    }

    mouseEvent(event){
        event.preventDefault();
	    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    ready(){
        document.addEventListener('mousemove',this.mouseEvent.bind(this), false);
        this.move();
        this.render();
    }

    move(){
        var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0);
        vector.unproject( this.camera );
        var dir = vector.sub( this.camera.position ).normalize();
        var distance = - this.camera.position.z / dir.z;
        var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );
        this.mesh.position.lerp(pos, 0.02)

        this.mesh.scale.x = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
        this.mesh.scale.y = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
        this.mesh.scale.z = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
        this.mesh.rotation.z += 0.005 + 0.01 * this.mesh.position.distanceTo(pos)
        // console.log(this.mesh.position)
        //this.mesh.rotation.x += 0.005 + 0.01 * this.mesh.position.distanceTo(pos)
    }



    render() {
        this.renderer.render(this.scene, this.camera)
    }

    onWindowResize(){
        this.camera.aspect = camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize( window.innerWidth, window.innerHeight)
    }

    
}

export default ThreeD;