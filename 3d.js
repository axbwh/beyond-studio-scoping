import * as THREE from 'three.js'


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
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.canvas = this.renderer.domElement
        this.canvas.setAttribute('data-sampler', 'threeDTexture')
        //document.body.appendChild( this.renderer.domElement );
    
        this.geometry = new THREE.PlaneGeometry( 1.5, 1.5 );

        this.material = new THREE.ShaderMaterial({
            vertexShader : vs,
            fragmentShader: fs,
            side : THREE.DoubleSide
        })

        //this.material = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide  } );
        this.shape = new THREE.Mesh( this.geometry, this.material );
        this.scene.add( this.shape );
        this.camera.position.z = 2;
        this.shape.rotation.z = Math.PI / 4 ;
        this.mouse = { x : 0.5, y: 0.5};

        
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
        this.shape.position.lerp(pos, 0.02)

        this.shape.scale.x = 1 + Math.sin(this.shape.rotation.y) * 0.1
        this.shape.scale.y = 1 + Math.sin(this.shape.rotation.y) * 0.1
        this.shape.rotation.y += 0.005 + 0.01 * this.shape.position.distanceTo(pos)
    }



    render() {

        this.renderer.render(this.scene, this.camera)
    }

    
}

export default ThreeD;