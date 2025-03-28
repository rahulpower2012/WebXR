// utils.js
let consoleDiv = null;
export function setUpLogging(div){
  consoleDiv = div;
  consoleDiv.innerHTML = `<b>------->> Allow Camera Permissions<br> 
                          ------->> Enter some text in the text box <br>
                          ------->> Click on "Add Text"<br>
                          ------->> Click on "Start AR" and allow required permissions<br>
                          ------->> Move back slowly with the phone in your hand.</b>`
  logError('setUpLogging', 'success');
}
export function logError(error, message) {
  if(consoleDiv){
    consoleDiv.innerHTML = document.getElementById('consoleDiv').innerHTML + `<p>${message}: ${error}</p>`
    console.error(`${message}: ${error.message}`, error);
  }
}



export function initGL(gl) {
    // Initialize WebGL-related settings and buffers
   }
   
   export function createCubeMesh(gl) {
     // Create and return cube vertices, normals, and indices
   }
   
   export function createShaderProgram (gl, vsSource, fsSource) {
   const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
   const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
     // Create the shader program
   
     const shaderProgram = gl.createProgram();
     gl.attachShader(shaderProgram, vertexShader);
     gl.attachShader(shaderProgram, fragmentShader);
     gl.linkProgram(shaderProgram);
   
     // If creating the shader program failed, alert
   
     if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
       alert(
         `Unable to initialize the shader program: ${gl.getProgramInfoLog(
           shaderProgram,
         )}`,
       );
       return null;
     }
   
     return shaderProgram;
   }
   
   //
   // creates a shader of the given type, uploads the source and
   // compiles it.
   //
   function loadShader(gl, type, source) {
     const shader = gl.createShader(type);
   
     // Send the source to the shader object
   
     gl.shaderSource(shader, source);
   
     // Compile the shader program
   
     gl.compileShader(shader);
   
     // See if it compiled successfully
   
     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
       alert(
         `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
       );
       gl.deleteShader(shader);
       return null;
     }
   
     return shader;
   }
   
