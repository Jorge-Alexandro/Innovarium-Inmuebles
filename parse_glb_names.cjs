const fs = require('fs');

function parseGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // Header: Magic (4 bytes), Version (4 bytes), Length (4 bytes)
  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== 'glTF') {
    console.error('Not a valid GLB file');
    return;
  }
  
  // First Chunk Header: Chunk Length (4 bytes), Chunk Type (4 bytes)
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.toString('utf8', 16, 20);
  
  if (chunkType !== 'JSON') {
    console.error('First chunk is not JSON');
    return;
  }
  
  const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonString);
  
  console.log('Total nodes:', gltf.nodes?.length);
  console.log('Total meshes:', gltf.meshes?.length);
  console.log('Total materials:', gltf.materials?.length);
  
  console.log('\nSample Nodes (first 50):');
  gltf.nodes?.slice(0, 50).forEach((node, i) => {
    console.log(`Node ${i}: name="${node.name || ''}" mesh=${node.mesh !== undefined ? node.mesh : 'none'}`);
  });

  console.log('\nSample Meshes (first 50):');
  gltf.meshes?.slice(0, 50).forEach((mesh, i) => {
    console.log(`Mesh ${i}: name="${mesh.name || ''}"`);
  });

  console.log('\nSample Materials (first 50):');
  gltf.materials?.slice(0, 50).forEach((mat, i) => {
    console.log(`Material ${i}: name="${mat.name || ''}"`);
  });
}

parseGlb('public/Meshy_AI_Vertical_Campus_Cross_30MB_final_valid.glb');
