/*========================= GET WEBGL CONTEXT ========================= */

function initWebGL(CANVAS) {
    var ctx = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"], GL;
    for (var i = 0; i < ctx.length; i++) {
        try { GL = CANVAS.getContext(ctx[i]); }
        catch (e) { }
        if (GL) break;
    }
    if (!GL) alert('Your browser does not support WebGL');
    return GL;
}

/*========================= VIEWPORT SETTINGS ========================= */

function fullscreen(CANVAS) {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    GL.viewport(0, 0, GL.drawingBufferWidth, GL.drawingBufferHeight);
}

function autoSizeSquare(CANVAS) {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    if (window.innerWidth > window.innerHeight) {
        window.innerWidth = window.innerHeight;
    }
    else {
        window.innerHeight = window.innerWidth;
    }
    GL.viewportWidth = window.innerWidth;
    GL.viewportHeight = window.innerHeight;
    GL.viewport((CANVAS.width - window.innerWidth) / 2, (CANVAS.height - window.innerHeight) / 2, GL.viewportWidth, GL.viewportHeight);
}

/*========================= INIT RESOURCES ========================= */
/*========== SHADERS ======== */
var PROGRAM;

function initShaders() {

    PROGRAM = GL.createProgram();

    var xhr = new XMLHttpRequest();
    //synchronous request requires a false third parameter
   // xhr.open('GET', './Shaders/Toon/shader.vs', false);
   xhr.open('GET', './Shaders/Phong/shader.vs', false);
    //overriding the mime type is required
    xhr.overrideMimeType('text/xml');
    xhr.send(null);

    if (xhr.readyState == xhr.DONE) {
        if (xhr.status === 200) {
            GL.attachShader(PROGRAM, initShader(GL, GL.VERTEX_SHADER, xhr.responseText));
        } else {
            console.error("Problem with fetting vertex shader: " + xhr.statusText);
        }
    }
    //xhr.open('GET', './Shaders/Toon/shader.fs', false);
    xhr.open('GET', './Shaders/Phong/shader.fs', false);
    xhr.send(null);
    if (xhr.readyState == xhr.DONE) {
        if (xhr.status === 200) {
            GL.attachShader(PROGRAM, initShader(GL, GL.FRAGMENT_SHADER, xhr.responseText));
        } else {
            console.error("Problem with getting frgment shader: " + xhr.statusText);
        }
    }

    GL.linkProgram(PROGRAM);

    if (!GL.getProgramParameter(PROGRAM, GL.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    GL.useProgram(PROGRAM);

    //attaching atributes(vertices, textre, normals) to GPU ARRAY_BUFFER (from CPU)
    PROGRAM.positionAttribLocation = GL.getAttribLocation(PROGRAM, "a_position");
    PROGRAM.textCordAttribLocation = GL.getAttribLocation(PROGRAM, "a_textCord");
    PROGRAM.normalAttribLocation = GL.getAttribLocation(PROGRAM, "a_vertNormal");

    //attaching uniforms to GPU ARRAY_BUFFER (from CPU)
    PROGRAM.matWorldUniformLocation = GL.getUniformLocation(PROGRAM, "u_mWorld");
    PROGRAM.matViewUniformLocation = GL.getUniformLocation(PROGRAM, "u_mView");
    PROGRAM.matProjUniformLocation = GL.getUniformLocation(PROGRAM, "u_mProj");

}

function initShader(GL, type, source) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    var success = GL.getShaderParameter(shader, GL.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(GL.getShaderInfoLog(shader));
    GL.deleteShader(shader);
}

/*========== TEXTURES ======== */

function initTexture() {
    texture = GL.createTexture();
    texture.image = new Image();
    //texture.image.src = "Textures/skull - Kopia.png";
    texture.image.src = "Textures/skull.png";
    texture.image.onload = function () {
        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, texture.image);
    }
}

/*========== JSON 3D DATA ======== */

function initJSON() {
    var request3 = new XMLHttpRequest();
    request3.open("GET", "3D/skull.json");
    request3.onreadystatechange = function () {
        if (request3.readyState == 4) {
            handleJSON(JSON.parse(request3.responseText));
        }
    }
    request3.send();
}

var INDICIES_LENGTH;
function handleJSON(json3D) {
    //creating lists of points in CPU
    var json3Dvertices = json3D.data.attributes.position["array"];
    var json3Dindices = json3D.data.index["array"]; //which set of verixes form a triangle (int) 
    var json3DtextUV = json3D.data.attributes.uv["array"];      //UV map
    var json3Dnormals = json3D.data.attributes.normal["array"]; //normals for lighting

    verticesBuffer = GL.createBuffer();
    textureBuffer = GL.createBuffer();
    indexBuffer = GL.createBuffer();
    normalsBuffer = GL.createBuffer();
    textureTexture = GL.createTexture();

    GL.bindBuffer(GL.ARRAY_BUFFER, verticesBuffer);
    GL.vertexAttribPointer(PROGRAM.positionAttribLocation, 3, GL.FLOAT, false,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(json3Dvertices), GL.STATIC_DRAW);
    GL.enableVertexAttribArray(PROGRAM.positionAttribLocation);

    GL.bindBuffer(GL.ARRAY_BUFFER, textureBuffer);
    GL.vertexAttribPointer(PROGRAM.textCordAttribLocation, 2, GL.FLOAT, false,
        2 * Float32Array.BYTES_PER_ELEMENT, 0);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(json3DtextUV), GL.STATIC_DRAW);
    GL.enableVertexAttribArray(PROGRAM.textCordAttribLocation);

    GL.bindBuffer(GL.ARRAY_BUFFER, normalsBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(json3Dnormals), GL.STATIC_DRAW);
    GL.vertexAttribPointer(PROGRAM.normalAttribLocation, 3, GL.FLOAT, true,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(json3Dindices), GL.STATIC_DRAW);

    GL.enableVertexAttribArray(PROGRAM.normalAttribLocation);
    INDICIES_LENGTH = json3D.data.index["array"].length;

    document.getElementById("loading_text").textContent = "";

    GL.enable(GL.CULL_FACE);
    // GL.cullFace(GL.BACK);     //setting which side of faces should be shown
    GL.enable(GL.DEPTH_TEST);  //check which faces are closest to camera, and render it
}