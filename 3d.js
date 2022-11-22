import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { LoopSubdivision } from 'three-subdivide';
import glb from './icon.glb'
import frag from './shaders/mesh.frag'
import meshdither from './shaders/mesh.glsl'
import headfrag from'./shaders/head.glsl'
import { times } from 'lodash';

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


const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

class ThreeD {
    constructor(pixelRatio){ //lets set up our three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.bbox = new THREE.Vector3()
    
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(pixelRatio)
        this.canvas = this.renderer.domElement
        this.canvas.setAttribute('data-sampler', 'threeDTexture') // this data attribute will automatically load our canvas 
        // as a uniform sampler2D called threeDTexture when we call ShaderPass.loadCanvas(theeD.canvas)

        this.material = new THREE.ShaderMaterial({
            vertexShader : vs,
            fragmentShader: frag,
            side : THREE.DoubleSide
        })

        this.material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            reflectivity: 0,
            shininess: 200,
            color:  new THREE.Color('black'),
            specular: new THREE.Color('white'),
            
        })

        this.material.onBeforeCompile = function ( shader ) {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <uv_pars_vertex>',
                'varying vec2 vUv;'
            ).replace(
                '#include <uv_vertex>',
                'vUv = uv;'
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                meshdither
            ).replace(
                '#define PHONG',
                headfrag
            ).replace(
                '#include <uv_pars_fragment>',
                'varying vec2 vUv;'
            )
        }

        this.scale = 5
        this.camera.position.z = 10
        this.mouse = { x : 0.5, y: 0.5}

        window.addEventListener( 'resize', this.onWindowResize.bind(this) )
        // this.domEl = document.body.appendChild( this.renderer.domElement )
        //  this.domEl.style.zIndex = 10000
        //  this.domEl.style.position = 'fixed'
        // this.domEl.style.top = 0

        this.lightTop = new THREE.PointLight( 0xffffff, 0.1, 0, 2);
        this.lightBottom = new THREE.PointLight( 0xffffff, 0.5, 0,2);
        this.scene.add(this.lightTop)
        this.scene.add(this.lightBottom)
        this.lightTop.position.set(-5, 40, 3)
        this.lightBottom.position.set(10, -40, 50)

        this.rotationTarget = new THREE.Quaternion()
        this.rotTdeg = new THREE.Euler()

    }

    setPixelRatio(pixelRatio){
        this.renderer.setPixelRatio(pixelRatio)
    }

    loadGlb(){
        // Instantiate a loader
        const loader = new GLTFLoader();

        // Optional: Provide a DRACOLoader instance to decode compressed mesh data
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader( dracoLoader );

        return loader.loadAsync(glb).then((glb) => {

             const geo = glb.scene.children[0].geometry
            // const smoothGeo = LoopSubdivision.modify(geo, 1)
            // this.geometry = smoothGeo
            this.geometry = geo
            this.mesh = new THREE.Mesh(this.geometry, this.material)
            this.scene.add( this.mesh );
            this.mesh.geometry.computeBoundingBox()
            this.mesh.rotation.x = Math.PI / 4 ;
            this.ready()
        })

    }



    screenToPos(x, y){
        var vector = new THREE.Vector3(x, y, 0);
        vector.unproject( this.camera );
        var dir = vector.sub( this.camera.position ).normalize();
        var distance = - this.camera.position.z / dir.z;
        var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );
        return pos
    }

    ready(){
        this.move({ range: 0, x: 0, y: 0, size: 20, rotation: 0}, {x: 0, y:0});
        this.render();
    }

    setScale(size){
        let dist = this.camera.position.distanceTo(this.mesh.position)
        let vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
        let vHeight = 2 * Math.tan( vFOV / 2 ) * dist; // visible height
        this.mesh.scale.x = vHeight * (size/ window.innerHeight);
        this.mesh.scale.y = vHeight * (size/ window.innerHeight);
        this.mesh.scale.z = vHeight * (size/ window.innerHeight);
    }

    setPos(axes){
        this.setScale(axes.size)
        this.mesh.rotation.z = axes.rotation
        let pos = this.screenToPos(axes.x, axes.y)
        this.mesh.position.copy(pos)
    }

    move(axes, mouse, rotation = 0, delta=1){
        
        let mpos = this.screenToPos(mouse.x, mouse.y)
        let pos = this.screenToPos(axes.x, axes.y)

        this.setScale(axes.size)

        pos.lerp(mpos, axes.range)

        this.mesh.rotation.z += (this.mesh.position.distanceTo(pos) * delta * 1.5)* axes.range
        this.mesh.position.lerp(pos, delta * 1.5)

        // this.mesh.scale.x = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
        // this.mesh.scale.y = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
        // this.mesh.scale.z = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
  

        this.rotTdeg.copy(this.mesh.rotation)
        this.rotTdeg.z = THREE.MathUtils.degToRad(axes.rotation + rotation)

        this.rotationTarget.setFromEuler(this.rotTdeg)
        this.mesh.quaternion.slerp(this.rotationTarget, delta* 2 * (1.0 -axes.range))
        
        // this.lightTop.lookAt(this.mesh.position)
        // this.lightBottom.lookAt(this.mesh.position)
        //this.mesh.rotation.x += 0.005 + 0.01 * this.mesh.position.distanceTo(pos)
    }



    render() {
        this.renderer.render(this.scene, this.camera)
    }

    onWindowResize(){
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize( window.innerWidth, window.innerHeight)
    }

    
}

export default ThreeD;