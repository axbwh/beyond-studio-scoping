import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { LoopSubdivision } from 'three-subdivide';
import glb from '/icon.glb'
import frag from '/shaders/mesh.frag'
import meshdither from '/shaders/mesh.glsl'
import headfrag from'/shaders/head.glsl'
import vs from'/shaders/mesh.vert'
import vertHead from '/shaders/vertex/head.vert'
import vertBody from '/shaders/vertex/body.vert'
import { times } from 'lodash';


const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

class ThreeD {
    constructor(pixelRatio, tier, app){ //lets set up our three.js scene
        this.app = app
        this.height = window.innerHeight
        this.width = window.innerWidth
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 50, this.width / this.height, 0.1, 1000 );
        this.bbox = new THREE.Vector3()
        this.isMobile = tier.isMobile
    
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: tier.tier > 2 ? true : false });
        this.renderer.setSize( this.width, this.height );
        this.renderer.setPixelRatio(pixelRatio)
        this.canvas = this.renderer.domElement
        this.velocity = new THREE.Vector3()
        this.vectorUtil = new THREE.Vector3()
        this.vHeight = 0

       
        this.canvas.setAttribute('data-sampler', 'threeDTexture') // this data attribute will automatically load our canvas 
        // as a uniform sampler2D called threeDTexture when we call ShaderPass.loadCanvas(theeD.canvas)

        //attractor
        this.material = new THREE.ShaderMaterial({
            vertexShader : vs,
            fragmentShader: frag,
            side : THREE.DoubleSide
        })

        let geo = new THREE.IcosahedronBufferGeometry(0, 0)
        this.attractor = new THREE.Mesh(geo, this.material)
        this.scene.add( this.attractor );

        this.material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            reflectivity: 0,
            shininess: 200,
            color:  new THREE.Color('black'),
            specular: new THREE.Color('white'),
        })



        this.material.onBeforeCompile =  ( shader ) => {
            shader.uniforms.uAttractor = { value: this.attractor.position}
            shader.uniforms.uVelocity = { value: this.velocity}
            shader.vertexShader = shader.vertexShader.replace(
                '#include <uv_pars_vertex>',
                vertHead
            ).replace(
                '#include <uv_vertex>',
                'vUv = uv;'
            ).replace(
                '#include <worldpos_vertex>',
                vertBody
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

            this.material.userData.shader = shader
        }

        this.scale = 5
        this.camera.position.z = 10
        this.mouse = { x : 0.5, y: 0.5}
        this.time = 0
        
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

        this.rotationQuart = new THREE.Quaternion()
        this.rotationTarget = 0
        this.groupRot = 0

        this.rotTdeg = new THREE.Euler()
        this.group = new THREE.Group()
        this.scene.add(this.group)

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
            //this.scene.add( this.mesh );
            this.group.add(this.mesh)
            this.mesh.geometry.computeBoundingBox()
            this.mesh.rotation.x = Math.PI / 2 ;
            
            // this.mesh.rotation.y = THREE.MathUtils.degToRad(180)
            this.ready()
        })

    }



    screenToPos(x, y){
        this.vectorUtil.set(x, y, 0);
        this.vectorUtil.unproject( this.camera );
        var dir = this.vectorUtil.sub( this.camera.position ).normalize();
        var distance = - this.camera.position.z / dir.z;
        var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );
        return pos
    }

    ready(){
        this.move({ range: 0, x: 0, y: 0, size: 20, rotation: 0, rotRange: 1}, {x: 0, y:0});
        this.render();
    }

    setScale(size){
        let dist = this.camera.position.distanceTo(this.group.position)
        let vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
        this.vHeight = 2 * Math.tan( vFOV / 2 ) * dist; // visible height
        this.mesh.scale.x = this.vHeight * (size/ this.height);
        this.mesh.scale.y = this.vHeight * (size/ this.height);
        this.mesh.scale.z = this.vHeight * (size/ this.height);
    }

    setPos(axes){
        this.setScale(axes.size)
        this.mesh.rotation.z = axes.rotation
        let pos = this.screenToPos(axes.x, axes.y)
        this.group.position.copy(pos)
    }

    mobileMove(axes){
        let xMult = 1 - (axes.size * 1.29 / this.width)
        let yMult = (1 - (axes.size / this.height))
        return this.screenToPos( Math.sin(this.time) * xMult , Math.sin(this.time / 2.5) * yMult * 0.4)
    }

    move(axes, mouse, delta=1){
        let mpos = this.isMobile ?  this.mobileMove(axes): this.screenToPos(mouse.x, mouse.y)
        let pos = this.screenToPos(axes.x, axes.y)

        let mobMult = this.isMobile ? (1 + (0.2*  axes.rotRange)) : 1


        this.setScale(axes.size * mobMult)

        pos.lerp(mpos, axes.range)

        this.mesh.rotation.z += (this.group.position.distanceTo(pos) * delta * 0.4)* axes.range
        this.group.position.lerp(pos, delta * 1.5)

        if(!this.isMobile && this.material.userData.shader){
            this.vectorUtil.copy(this.attractor.position)
            this.attractor.position.lerp(mpos, delta * 2)
            //this.velocity.copy(this.attractor.position).sub(this.vectorUtil).clampLength(-0.8, 0.8)

            let velocityDelta = this.velocity.clone().copy(this.attractor.position).sub(this.vectorUtil)
            this.velocity.add(velocityDelta).clampLength(-2.5, 2.5)
            let friction = this.velocity.clone().negate().multiplyScalar(delta * 8)
            this.velocity.add(friction)

            this.material.userData.shader.uniforms.uAttractor.value = this.attractor.position
        }

        // this.mesh.scale.x = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
        // this.mesh.scale.y = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
        // this.mesh.scale.z = this.scale + Math.sin(this.mesh.rotation.y) * 0.1
  
        this.rotTdeg.copy(this.mesh.rotation)
        this.rotTdeg.z = THREE.MathUtils.degToRad(axes.rotation)

        this.rotationQuart.setFromEuler(this.rotTdeg)
        this.mesh.quaternion.slerp(this.rotationQuart, delta * 2 * (1.0 - axes.range))

        this.groupRot = this.app.curtains.lerp(this.groupRot, THREE.MathUtils.degToRad(this.rotationTarget)  * axes.rotRange , delta * 2)
        
        if(this.groupRot > Math.PI * 2){
            this.groupRot = 0
            this.rotationTarget = this.rotationTarget - 360
        }else if(this.groupRot < 0){
            this.groupRot = Math.PI * 2
            this.rotationTarget = this.rotationTarget + 360
        }

        this.group.rotation.y = this.groupRot
        
        

        this.time += delta / 2
    }



    render() {
        this.renderer.render(this.scene, this.camera)
    }

    onWindowResize(){
        this.height = window.innerHeight
        this.width = window.innerWidth
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize( this.width, this.height)
    }

    
}

export default ThreeD;