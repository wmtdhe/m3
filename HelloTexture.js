var gl;
var canvas;

var shaderProgram;
var shaderProgram1;
//vertices faces
var teapot;
// Buffer for teapot vertex and normals
var teapotVertexBuffer;
var teapotVertexNormalBuffer;
var teapotIndexTriangleBuffer;
var teapotIndexEdgeBuffer;

// Create a place to store the texture coords for the mesh
var cubeTCoordBuffer;

// Create a place to store terrain geometry
var cubeVertexBuffer;

// Create a place to store the triangles
var cubeTriIndexBuffer;

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

// Create ModelView matrix
var mvMatrix1 = mat4.create();

//Create Projection matrix
var pMatrix1 = mat4.create();

var mvMatrix12 = mat4.create();
var mvMatrixStack = [];
var mvMatrixStack1 = [];
var mvMatrixStack12 = [];

// Create a place to store the texture

var cubeImage;
var cubeTexture = [];
var teapotTexture;

// For animation and rotation
var then =0;
// skybox
var modelXRotationRadians = degToRad(0);
var modelYRotationRadians = degToRad(0);
// teapot itself
var modelXRotationRadians1 = degToRad(0);
var modelYRotationRadians1 = degToRad(0);

// View parameters
var eyePt = vec3.fromValues(0.0,0.4,0.8);
var viewDir = vec3.fromValues(0.0,-0.22,-.65);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,-0.4);


/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.useProgram(shaderProgram);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader1() {
  gl.useProgram(shaderProgram1);
  gl.uniformMatrix4fv(shaderProgram1.mvMatrixUniform, false, mvMatrix1);
gl.uniformMatrix4fv(shaderProgram1.mvMatrixRotationUniform, false, mvMatrix12);
}

/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.useProgram(shaderProgram);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader1() {
  gl.useProgram(shaderProgram1);
  gl.uniformMatrix4fv(shaderProgram1.pMatrixUniform, 
                      false, pMatrix1);
}

/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix1() {
    var copy = mat4.clone(mvMatrix1);
    mvMatrixStack1.push(copy);
}

//---
function mvPushMatrix12() {
    var copy = mat4.clone(mvMatrix12);
    mvMatrixStack12.push(copy);
}


/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix1() {
    if (mvMatrixStack1.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix1 = mvMatrixStack1.pop();
}


//--
function mvPopMatrix12() {
    if (mvMatrixStack12.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix12 = mvMatrixStack12.pop();
}


/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();
}

/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms1() {
    uploadModelViewMatrixToShader1();
    uploadProjectionMatrixToShader1();
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  vertexShader1 = loadShaderFromDOM("shader-vs1");
  fragmentShader1 = loadShaderFromDOM("shader-fs1");
  
  shaderProgram = gl.createProgram();
  shaderProgram1 = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }
  
  gl.attachShader(shaderProgram1, vertexShader1);
  gl.attachShader(shaderProgram1, fragmentShader1);
  gl.linkProgram(shaderProgram1);

  if (!gl.getProgramParameter(shaderProgram1, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
    
  
  shaderProgram.texCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord");
  console.log("Tex coord attrib: ", shaderProgram.texCoordAttribute);
  gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);
    
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  console.log("Vertex attrib: ", shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  
  gl.useProgram(shaderProgram1);
    
  
  // Setup shader for teapot

    
  shaderProgram1.vertexPositionAttribute = gl.getAttribLocation(shaderProgram1, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram1.vertexPositionAttribute);

  shaderProgram1.vertexNormalAttribute = gl.getAttribLocation(shaderProgram1, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram1.vertexNormalAttribute);

  shaderProgram1.mvMatrixRotationUniform = gl.getUniformLocation(shaderProgram1, "uMVMatrixRotation");
  shaderProgram1.mvMatrixUniform = gl.getUniformLocation(shaderProgram1, "uMVMatrix");
  shaderProgram1.pMatrixUniform = gl.getUniformLocation(shaderProgram1, "uPMatrix");
  shaderProgram1.nMatrixUniform = gl.getUniformLocation(shaderProgram1, "uNMatrix");
  shaderProgram1.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram1, "uLightPosition");    
  shaderProgram1.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram1, "uAmbientLightColor");  
  shaderProgram1.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram1, "uDiffuseLightColor");
  shaderProgram1.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram1, "uSpecularLightColor");
    //check if environment mapping
  shaderProgram1.uniformReflection = gl.getUniformLocation(shaderProgram1, "uReflection");
    
    
  //shaderProgram1.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram1, "uAmbientMatColor");  
 // shaderProgram1.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram1, "uDiffuseMatColor");
 // shaderProgram1.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram1, "uSpecularMatColor"); 
  gl.useProgram(shaderProgram);
}

/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram1.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram1.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram1.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram1.uniformSpecularLightColorLoc, s);
   // gl.uniform1i(shaderProgram1.uniformRelfection, r)
    //fog
//gl.uniform1f(shaderProgram.uniformFogLightColorLoc, f);
}
function uploadMaterialToShader(a,d,s) {
  gl.uniform3fv(shaderProgram1.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram1.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram1.uniformSpecularMatColorLoc, s);
}

/**
 * Draw a cube based on buffers.
 */
function drawCube(){
  gl.useProgram(shaderProgram);

  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.
 // 6 pics
  for (var i = 0; i < 6; i++) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[i]);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
  //gl.uniform1i(gl.getUniformLocation(shaderProgram1, "uSampler1"), 0);


	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i*12);
  }
    //new added sd1
}

/**
 * Draw teapot with shader 1
 */
function drawTeapot(){
 gl.useProgram(shaderProgram1);
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexBuffer);
 gl.vertexAttribPointer(shaderProgram1.vertexPositionAttribute, 3, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram1.vertexNormalAttribute, 
                           3,
                           gl.FLOAT, false, 0, 0);   
    
/**
*usampler
*/
 gl.activeTexture(gl.TEXTURE0);
 gl.bindTexture(gl.TEXTURE_CUBE_MAP, teapotTexture);
 gl.uniform1i(gl.getUniformLocation(shaderProgram1, "uSampler"), 0);
 //Draw 
    
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriangleBuffer);
 gl.drawElements(gl.TRIANGLES, teapotIndexTriangleBuffer.numItems, gl.UNSIGNED_SHORT,0);
}

/**
 * Draw call that applies matrix transformations to cube
 */
function draw() {
	gl.useProgram(shaderProgram);
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
    
    //Draw 
    mvPushMatrix();
	mat4.rotateX(mvMatrix,mvMatrix,modelXRotationRadians);
    mat4.rotateY(mvMatrix,mvMatrix,modelYRotationRadians);
    setMatrixUniforms();    
    drawCube();
    mvPopMatrix();
}


function setupTeapotBuffers() {
    gl.useProgram(shaderProgram1);
    teapotVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexPositions), gl.DYNAMIC_DRAW);
    teapotVertexBuffer.itemSize = 3;
    teapotVertexBuffer.numItems = teapot.vertexPositions.length; 
    
    // Specify normals to be able to do lighting calculations
    for (var i = 0; i < teapot.vertexPositions.length; i++) {
					teapot.vertexNormals.push(0.0);
				}
    calnorm(teapot.indices, teapot.vertexPositions, teapot.vertexNormals);
    teapotVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexNormals),
                  gl.DYNAMIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = teapot.vertexNormals.length; 
    
    // Specify faces of the terrain 
    teapotIndexTriangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapot.indices),
                  gl.DYNAMIC_DRAW);
    teapotIndexTriangleBuffer.itemSize = 1;
    teapotIndexTriangleBuffer.numItems = teapot.indices.length; //*3?
}



/**
 * Draw call that applies matrix transformations to teapot
 */
function draw_t() {
	gl.useProgram(shaderProgram1);
	
	gl.enable(gl.DEPTH_TEST);
	
    // We'll use perspective 
    mat4.perspective(pMatrix1,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
    mat4.lookAt(mvMatrix1,eyePt,viewPt,up);
 
    //Draw 
   // ka = vec3.fromValues(0.0,0.0,0.0);
   // kd = vec3.fromValues(0.0,0.0,0.5);
   // ks = vec3.fromValues(0.0,0.0,0.5);
    mvPushMatrix1();
    mvPushMatrix12();
    //teapot texture rotation
    mat4.rotateY(mvMatrix12,mvMatrix12, modelYRotationRadians);
	mat4.rotateX(mvMatrix12,mvMatrix12, modelXRotationRadians);
    	mat4.scale(mvMatrix12, mvMatrix12, vec3.fromValues(1.0,1.0,-1.0));
    //----skybox
	mat4.rotateX(mvMatrix1,mvMatrix1,modelXRotationRadians);
    //teapot in skybox
    mat4.rotateY(mvMatrix1,mvMatrix1,modelYRotationRadians);
    //teapot itself
	mat4.rotateX(mvMatrix1,mvMatrix1,modelXRotationRadians1);
    mat4.rotateY(mvMatrix1,mvMatrix1,modelYRotationRadians1);
    setMatrixUniforms1(); 
    

	uploadLightsToShader([0.0,1.0,1.0],[1.0, 1.0, 1.0],[1.0, 1.0, 1.0],[1.0, 1.0, 1.0], [0,0,0]);
    if(document.getElementById("reflection").checked){
      //gl.uniform1i(shaderProgram1.uniformReflection, 1);
        gl.uniform1i( shaderProgram1.uniformReflection, 1);
    }
    else{
        //gl.uniform1i(shaderProgram1.uniformReflection, 0);
        gl.uniform1i(shaderProgram1.uniformReflection, 0);
    }

    //uploadMaterialToShader(ka,kd,ks);
    drawTeapot();
    mvPopMatrix12();
    mvPopMatrix1();

}

/**
 * Animation to be called from tick. Currently does nothing
 */
function animate() {
      /*  if (then==0)
    {
        then = Date.now();
    }
    else
    {
        now=Date.now();
        // Convert to seconds
        now *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = now - then;
        // Remember the current time for the next frame.
        then = now;

        //Animate the rotation
        modelXRotationRadians += 1.2 * deltaTime;
        modelYRotationRadians += 0.7 * deltaTime;  
    }
    */
}

/**
*set teapot texture
*/
function setupTeapotTexture(){
    gl.useProgram(shaderProgram1);
    teapotTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, teapotTexture); 
	
	// Set texture parameters
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, 
          gl.LINEAR); 
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER,    
          gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    
    // Load up each cube map face
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
          teapotTexture, 'demo/canary/pos-x.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,    
        teapotTexture, 'demo/canary/neg-x.png');    
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
        teapotTexture, 'demo/canary/pos-y.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
       teapotTexture, 'demo/canary/neg-y.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
       teapotTexture, 'demo/canary/pos-z.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
       teapotTexture, 'demo/canary/neg-z.png'); 
}
function loadCubeMapFace(gl, target, texture, url){
    var image = new Image();
    image.onload = function()
    {
    	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
    image.src = url;
}


/**
 * Creates texture for application to cube.
 */
function setupTextures(url) {

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 155, 155]));

  var cubeImage = new Image();
  cubeImage.onload = function() { 
    handleTextureLoaded(cubeImage, tex); 
  }
  cubeImage.src = url;
  
  cubeTexture.push(tex);
}

/**
 * @param {number} value Value to determine whether it is a power of 2
 * @return {boolean} Boolean of whether value is a power of 2
 */
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

/**
 * Texture handling. Generates mipmap and sets texture parameters.
 * @param {Object} image Image for cube application
 * @param {Object} texture Texture for cube application
 */
function handleTextureLoaded(image, texture) {
  console.log("handleTextureLoaded, image = " + image);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
     console.log("Loaded power of 2 texture");
  } else {
     // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     console.log("Loaded non-power of 2 texture");
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

/**
 * Sets up buffers for cube.
 */
function setupBuffers() {

  // Create a buffer for the cube's vertices.

  cubeVertexBuffer = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    // Front face
	 1.0,  1.0,  1.0,
	-1.0,  1.0,  1.0,
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
    

    // Back face
	 1.0,  1.0, -1.0,
	-1.0,  1.0, -1.0,
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
	-1.0,  1.0,  1.0,
	 1.0,  1.0,  1.0,
	 1.0,  1.0, -1.0,
    -1.0,  1.0, -1.0,


    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
	 1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
	 1.0, -1.0,  1.0,
     1.0, -1.0, -1.0,

    // Left face
	-1.0,  1.0, -1.0,
	-1.0,  1.0,  1.0,
	-1.0, -1.0,  1.0,	
	-1.0, -1.0, -1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Map the texture onto the cube's faces.

  cubeTCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);

  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    
    1.0,  0.0,
	0.0,  0.0,
    0.0,  1.0,
	1.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    
    1.0,  0.0,
	0.0,  0.0,
    0.0,  1.0,
	1.0,  1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.DYNAMIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeTriIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}


/**
 * Gets a file from the server for processing on the client side.
 *
 * @param  file A string that is the name of the file to get
 * @param  callbackFunction The name of function (NOT a string) that will receive a string holding the file
 *         contents.
 *
 */
function readTextFile(file, callbackFunction)
{
    console.log("reading "+ file);
    var rawFile = new XMLHttpRequest();
    var allText = [];
    rawFile.open("GET", file, true);
    
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                 teapot = callbackFunction(String(rawFile.responseText));
                    setupTeapotBuffers();

            }
        }
    }
    rawFile.send(null);
}

/**
 * obtain from https://github.com/shawnwalton/obj2json to parse obj file.
 */
function obj2json(input) {
	var lines = input.split(/\r\n|\r|\n/g);
	var out = {};
	out.vertexPositions = [];
	out.vertexNormals = [];
	out.vertexTextureCoords = [];
	out.indices = [];
	lines.forEach(function(line) {
		var linePieces = line.split(" ");
		if(linePieces[0] == "v") {
			//this is a vertex entry. we'll ignore the w coord
			for(var i = 1; i < 4; i++) {
				var num = parseFloat(linePieces[i]);
				num /= 20;
				out.vertexPositions.push(num);
			}
		}
		else if(linePieces[0] == "vn") {
			//this is a normals entry
			for(var i = 1; i < 4; i++)
				out.vertexNormals.push(parseFloat(linePieces[i]));
		}
		else if(linePieces[0] == "vt") {
			//this is a texture coordinate entry, again ignoring w coord
			for(var i = 1; i < 3; i++)
				out.vertexTextureCoords.push(parseFloat(linePieces[i]));
		}
		else if(linePieces[0] == "f") {
			//this is a face entry. indices in the file start at 1, but we want them to start at 0 in js
			for(var i = 2; i < 5; i++) {
				out.indices.push(parseInt(parseInt(linePieces[i]) - 1));
			}
		}
	});
	return out;
}
//function loadTeapot() {
//	readTextFile("teapot_0.obj", obj2json);
//}
//----------------------------------------------------------------------------------
//Code to handle user interaction
var currentlyPressedKeys = {};

function handleKeyDown(event) {
        currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
        currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
    
        if ( currentlyPressedKeys[65]) {
            //  A
            modelYRotationRadians1 -= 0.05;
        } else if (currentlyPressedKeys[68]) {
            // D
            modelYRotationRadians1 += 0.05;
        } 
        
        if ( currentlyPressedKeys[87]) {
            //  W
            modelXRotationRadians1 -= 0.05;
        } else if (currentlyPressedKeys[83]) {
            // S
            modelXRotationRadians1 += 0.05;
        } 
//--------------skybox
        if (currentlyPressedKeys[49]) {
            // 1
            modelYRotationRadians -= 0.05;
        } else if ( currentlyPressedKeys[51]) {
            // 3
            modelYRotationRadians += 0.05;
        } 
    
            if (currentlyPressedKeys[50]) {
            // 2
            modelXRotationRadians -= 0.05;
        } else if ( currentlyPressedKeys[52]) {
            // 4
            modelXRotationRadians += 0.05;
        } 
    
     //   if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
            // Up cursor key or W
     //       modelXRotationRadians1 -= 0.05;
     //   } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
            // Down cursor key
    //       modelXRotationRadians1 += 0.05;
     //   } 
}
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);

  setupShaders();
  setupBuffers();
//env texture for teapot
  setupTeapotTexture(); 
//setup teapotbuffer
  readTextFile("teapot_0.obj", obj2json);

//texture mapping for skybox
  setupTextures("demo/canary/neg-z.png");
  setupTextures("demo/canary/pos-z.png");
  setupTextures("demo/canary/pos-y.png");
  setupTextures("demo/canary/neg-y.png");
  setupTextures("demo/canary/pos-x.png");
  setupTextures("demo/canary/neg-x.png");
  
//key
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);	

    draw();//cube
    draw_t();//teapot
    handleKeys();
    animate();
}

