import * as THREE from 'three';
import fs from 'fs';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';

globalThis.ProgressEvent = class ProgressEvent { constructor() {} };
globalThis.Worker = class Worker { constructor() {} postMessage() {} terminate() {} addEventListener() {} removeEventListener() {} };

async function main() {
  const buf = fs.readFileSync('public/assets/lesson_01/Lesson01_Trees_v003.glb');
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(draco);
  await new Promise((resolve, reject) => {
    loader.parse(ab, '', (gltf) => {
      gltf.scene.traverse(o => {
        if (o.isMesh) {
          console.log('Mesh:', o.name, 'mat:', o.material?.type, 'color:', o.material?.color?.getHexString(), 'map:', !!o.material?.map, 'transparent:', o.material?.transparent, 'opacity:', o.material?.opacity, 'side:', o.material?.side, 'roughness:', o.material?.roughness, 'metalness:', o.material?.metalness);
        }
      });
      console.log('---GLTF materials JSON---');
      console.log(JSON.stringify(gltf.parser.json.materials, null, 2));
      console.log('---Meshes JSON---');
      console.log(JSON.stringify(gltf.parser.json.meshes, null, 2));
      console.log('---Nodes JSON---');
      console.log(JSON.stringify(gltf.parser.json.nodes, null, 2));
      resolve();
    }, (err) => { console.error('Error:', err); reject(err); });
  });
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
