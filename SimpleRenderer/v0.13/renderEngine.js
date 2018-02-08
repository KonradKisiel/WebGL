var gl;

function initWebGL(canvas) {
    var ctx = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"], gl;
    for (var i = 0; i < ctx.length; i++) {
        try { gl = canvas.getContext(ctx[i]); }
        catch (e) { }
        if (gl) break;
    }
    if (!gl) alert('Your browser does not support WebGL');
    return gl;
}

function fullscreen(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    //check fullscreen with 1 in camera
}

function autoSizeSquare(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (window.innerWidth > window.innerHeight) {
        window.innerWidth = window.innerHeight;
    }
    else {
        window.innerHeight = window.innerWidth;
    }
    gl.viewportWidth = window.innerWidth;
    gl.viewportHeight = window.innerHeight;
    gl.viewport((canvas.width - window.innerWidth) / 2, (canvas.height - window.innerHeight) / 2, gl.viewportWidth, gl.viewportHeight);
}

//
// LOADING RESOURCES
//

var program;

function initShaders() {

    program = gl.createProgram();

    var xhr = new XMLHttpRequest();
    //synchronous request requires a false third parameter
    xhr.open('GET', './Shaders/Toon/shader.vs', false);
    //overriding the mime type is required
    xhr.overrideMimeType('text/xml');
    xhr.send(null);

    if (xhr.readyState == xhr.DONE) {
        if (xhr.status === 200) {
            gl.attachShader(program, initShader(gl, gl.VERTEX_SHADER, xhr.responseText));
        } else {
            console.error("Problem with fetting vertex shader: " + xhr.statusText);
        }
    }
    xhr.open('GET', './Shaders/Toon/shader.fs', false);
    xhr.send(null);
    if (xhr.readyState == xhr.DONE) {
        if (xhr.status === 200) {
            gl.attachShader(program, initShader(gl, gl.FRAGMENT_SHADER, xhr.responseText));
        } else {
            console.error("Problem with getting frgment shader: " + xhr.statusText);
        }
    }

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(program);

    //attaching atributes(vertices, textre, normals) to GPU ARRAY_BUFFER (from CPU)
    program.positionAttribLocation = gl.getAttribLocation(program, "a_position");
    program.textCordAttribLocation = gl.getAttribLocation(program, "a_textCord");
    program.normalAttribLocation = gl.getAttribLocation(program, "a_vertNormal");

    //attaching uniforms to GPU ARRAY_BUFFER (from CPU)
    program.matWorldUniformLocation = gl.getUniformLocation(program, "u_mWorld");
    program.matViewUniformLocation = gl.getUniformLocation(program, "u_mView");
    program.matProjUniformLocation = gl.getUniformLocation(program, "u_mProj");

}

//basic function overloading, adding error checking
function initShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}


function initTexture() {
    texture = gl.createTexture();
    texture.image = new Image();
    texture.image.src = "Textures/Lippisch2048.png";
    texture.image.onload = function () {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    }
}

function initJSON() {
    var request3 = new XMLHttpRequest();
    request3.open("GET", "3D/LippischP13a.json");
    request3.onreadystatechange = function () {
        if (request3.readyState == 4) {
            handleJSON(JSON.parse(request3.responseText));
        }
    }
    request3.send();
}

var indiciesLength;
function handleJSON(json3D) {
    //creating lists of points in CPU
    var json3Dvertices = json3D.data.attributes.position["array"];
    var json3Dindices = json3D.data.index["array"]; //which set of verixes form a triangle (int) 
    var json3DtextUV = json3D.data.attributes.uv["array"];      //UV map
    var json3Dnormals = json3D.data.attributes.normal["array"]; //normals for lighting

    verticesBuffer = gl.createBuffer();
    textureBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    normalsBuffer = gl.createBuffer();
    textureTexture = gl.createTexture();

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.vertexAttribPointer(program.positionAttribLocation, 3, gl.FLOAT, false,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(json3Dvertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.positionAttribLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(program.textCordAttribLocation, 2, gl.FLOAT, false,
        2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(json3DtextUV), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.textCordAttribLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(json3Dnormals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.normalAttribLocation, 3, gl.FLOAT, true,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(json3Dindices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(program.normalAttribLocation);
    indiciesLength = json3D.data.index["array"].length;
    //document.getElementById("loadingText").textContent = "";

    gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.BACK);     //setting which side of faces should be shown
    gl.enable(gl.DEPTH_TEST);  //check which faces are closest to camera, and render it
}

function main() {
    var canvas = document.getElementById("WebGL_canvas");
    gl = initWebGL(canvas);
    autoSizeSquare(canvas);
    initShaders();

    //creating matrices with 0.0
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    //creating identity matrix
    mat4.identity(worldMatrix);
    //glMatrix Function lookAt(out[x, y, z], eye, up, center)
    mat4.lookAt(viewMatrix, [2.0, 3.0, -7.0], [0.0, -0.7, 0.0], [0.0, 1.0, 0.0]);
    //glmatrix perspective (out, fov in radians, seting aspect ratio, nearest, farest possible psn)   
    //fullscreen mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);
    mat4.perspective(projMatrix, glMatrix.toRadian(45), 1.0, 0.1, 1000.0);
    //sending matrices to shader() WebGLUniformLocation, always FALSE for webGL, Float32Array)
    gl.uniformMatrix4fv(program.matWorldUniformLocation, false, worldMatrix);
    gl.uniformMatrix4fv(program.matViewUniformLocation, false, viewMatrix);
    gl.uniformMatrix4fv(program.matProjUniformLocation, false, projMatrix);

    initTexture();
    initJSON();


    //creating identity matrix
    var identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);
    //creating rotation matrices
    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);
    //one full rotation (speed)
    var v_rotation = 1500;
    //dont draw two sides of faces

    //
    //Main render loop
    //
    var render = function () {
        rotationSpeed = performance.now() / v_rotation;
        //rotate(receiving matrix, matrix to rotate, angle to rotate (rad), axis to rotate around) 
        //mat4.rotate(worldMatrix, identityMatrix, angle, [0.0, 1.0, 0.0]);
        //mat4.rotate(xRotationMatrix, identityMatrix, angle, [1.0, 0.0, 0.0])
        mat4.rotate(yRotationMatrix, identityMatrix, rotationSpeed, [0.0, 1.0, 0.0]);

        // mat4.fromTranslation(identityMatrix, [0, 0, -6]);
        //mat4.mul(identityMatrix, mouseRotationMatrix, mouseRotationMatrix);
        //mat4.mul(worldMatrix, xRotationMatrix, yRotationMatrix);


        // mat4.rotate(mouseRotationMatrix, identityMatrix, rotationSpeed, [0.0, 1.0, 0.0]);
        //mat4.mul(worldMatrix, xRotationMatrix, yRotationMatrix);
        //update worldMatrix
        gl.uniformMatrix4fv(program.matWorldUniformLocation, false, yRotationMatrix);

        //update worldMatrix
        //gl.uniformMatrix4fv(matWorldUniformLocation, false, mouseRotationMatrix);
        //  gl.clearColor(0.35, 0.0, 0.55, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //render multiple sets of primitives from array data
        //drawElements(gl.TRIANGLES, cont of points to draw, type, offset from begining)
        gl.drawElements(gl.TRIANGLES, indiciesLength, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
}