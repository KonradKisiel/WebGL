var gl;
//
// LOADING RESOURCES
//
var init = function () {
	loadTextResource('./shader.vs.glsl', function (vsErr, vsText) {
		if (vsErr) {
			alert('Fatal error getting vertex shader (see console)');
			console.error(vsErr);
		} else {
			loadTextResource('./shader.fs.glsl', function (fsErr, fsText) {
				if (fsErr) {
					alert('Fatal error getting fragment shader (see console)');
					console.error(fsErr);
				} else {
					loadJSONResource('./ModelMig105.json', function (modelErr, model) {
						if (modelErr) {
							alert('Fatal error getting model (see console)');
							console.error(fsErr);
						} else {
							loadImage('./TextureMig105.png', function (imgErr, txt) {
								if (imgErr) {
									alert('Fatal error getting texture (see console)');
									console.error(imgErr);
								} else { 
									run(vsText, fsText, txt, model);
								}
							});
						}
					});
				}
			});
		}
	});
};

// Load a text (shader) resource from a file over the network
var loadTextResource = function (url, callback) {
    //request creation
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    //function called whe the request is completted
    request.onload = function(){
        //error handling
        if(request.status < 200 || request.status > 299){
            callback('Error: HTTP Status '+request.status+' on resource '+url);
        }else{//return text from file
            callback(null, request.responseText);
        }
    }
    request.send();
};

var loadImage = function(url, callback){
    var image = new Image();
    image.onload = function(){
        callback(null, image);
    };
    image.src = url;
};

var loadJSONResource = function (url, callback){
    loadTextResource(url, function(err, result){
        if(err){callback(err);}
        else{
            try{callback(null, JSON.parse(result));}
            catch(e){callback(e);}
        }
    });
};

function checkWebGL(canvas) {
    var ctx = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"], gl;
    for (var i = 0; i < ctx.length; i++) {
        try { gl = canvas.getContext(ctx[i]); }
        catch (e) { }
        if (gl) break;
    }
    if (!gl) alert('Your browser does not support WebGL');
    return gl;
}
//basic function overloading, adding error checking
function createShader(gl, type, source) {
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

function run(vertexShaderText, fragmentShaderText, texture, json3D) {
    j3d = json3D;
    var canvas = document.getElementById("WebGL_canvas");
    gl = checkWebGL(canvas);
    //fullscreen with max possible size 
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewportWidth = window.innerWidth;
    gl.viewportHeight = window.innerHeight;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    //[telling that we want to use two fragments of pipeline together in program]
    //creating program
    var program = gl.createProgram();
    //creating and attaching shaders to program
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShaderText));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText));
    //linking things together
    gl.linkProgram(program);
    //checking for link errors
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program', gl.getProgramInfoLog(program));
        return;
    }
    //catching additional errors
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }
    //tell WebGL state machine which shaders program shold be active   
    gl.useProgram(program);
    //attaching atributes to GPU ARRAY_BUFFER (from CPU)
    var positionAttribLocation = gl.getAttribLocation(program, "a_position");
    var textCordAttribLocation = gl.getAttribLocation(program, 'a_textCord');

    //attaching uniforms to GPU ARRAY_BUFFER (from CPU)
    var matWorldUniformLocation = gl.getUniformLocation(program, "u_mWorld");
    var matViewUniformLocation = gl.getUniformLocation(program, "u_mView");
    var matProjUniformLocation = gl.getUniformLocation(program, "u_mProj");
    //creating matrices with 0.0
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    //creating identity matrix
    mat4.identity(worldMatrix);
    //glMatrix Function lookAt(out[x, y, z], eye, up, center)
    mat4.lookAt(viewMatrix, [2.0, 3.0, -6.0], [0.0, -0.7, 0.0], [0.0, 1.0, 0.0]);
    //glmatrix perspective (out, fov in radians, seting aspect ratio, nearest, farest possible psn)
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0)
    //mat4.identity(projMatrix);
    //sending matrices to shader, 4x4 float matrix
    //WebGLRenderingContext.uniformMatrix2fv(location, transpose, value)
    //WebGLUniformLocation, always FALSE for webGL, Float32Array
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
    //Cube vertives
    //creating list of points (Vertex Data) in CPU
    var json3Dvertices = json3D.data.attributes.position["array"];
    //which set of verixes form a triangle (int)
    var json3Dindices = json3D.data.index["array"];
    //UV map access
    var json3DtextUV = json3D.data.attributes.uv["array"];
    var verticesBuffer = gl.createBuffer();
    //Global bind points are (punkt odniesienia) attacheing to the ARRAY_BUFFER
    //binding verticesBuffer with ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    //positions are getting attach to the verticesBuffer(due to binded ARRAY_BUFFER)
    //STATIC_DRAW - the data optimalization for draw
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(json3Dvertices), gl.STATIC_DRAW);
    //attach texture to ARRAY_BUFFER
    var textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(json3DtextUV), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(json3Dindices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    //specify layout of that attribute, object preparation (a_position)
    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        3, //nr of elemnts per attributes (vec2 a_position)
        gl.FLOAT, //type of elemnts, 32bit floats
        gl.FALSE, //data normalization
        3 * Float32Array.BYTES_PER_ELEMENT,// Size of an individual vertex
        0 // Offset from the begining of a single vetex to this attribute
    );
   //Turning attributes on to take them from buffer
    gl.enableVertexAttribArray(positionAttribLocation);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(
        textCordAttribLocation, // Attribute location
        2, //nr of elemnts per attributes
        gl.FLOAT, //type of elemnts
        gl.FALSE, //data normalization
        2 * Float32Array.BYTES_PER_ELEMENT,// Size of each element
        0   // Offset from the begining of a single vetex to this attribute
    );
    //Turning attributes on to take them from buffer
    gl.enableVertexAttribArray(textCordAttribLocation);
    //
    // Create texture
    //
    //*********** IMPORTANT ***********
    //The code must be runing on localserver/server 
    //due to browsers security restrictions,
    //problem with getting and setting texture
    var boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    //flip texture diagonaly
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // set texture parameters (target, pname, param) gl.TEXTURE_WRAP_(S/T) S=U, T=V, set the ege to repeat
    // param = kind of repeating
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //setting filtering method(LINEAR/NEAREST...) and inerpolation of img for scaling down(MIN) and up(MAG))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
    gl.texImage2D(
        gl.TEXTURE_2D,     //target
        0,                 //level of detail 0-base, n is the nth reduction of detail
        gl.RGBA,           //internalformat: ALPHA/RGB/RGBA/LUMINANCE/LUMINANCE_ALPHA....
        //                 //width in <img tags>
        //                 //height also
        //                 //no border
        gl.RGBA,           //format - must be the same as internalformat
        gl.UNSIGNED_BYTE,  //type - gl.UNSIGNED_BYTE: 8 bits per channel for gl.RGBA
        texture              //img data
    );
    //unbinding texture - 
    //gl.bindTexture(gl.TEXTURE_2D, null);
    //creating identity matrix
    var identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);
    //creating rotation matrices
    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);
    //one full rotation (speed)
    var v_angle = 1000 * 2 * Math.PI / 5;
    //dont draw two sides of faces
    gl.enable(gl.CULL_FACE);
    //setting which side of faces should be shown
    //gl.cullFace(gl.FRONT);
    gl.cullFace(gl.BACK);
    //check which faces are closest to camera, and render it
    gl.enable(gl.DEPTH_TEST);
    //
    //Main render loop
    //
    var loop = function () {
        angle = performance.now() / v_angle;
        //rotate(receiving matrix, matrix to rotate, angle to rotate (rad), axis to rotate around) 
        //mat4.rotate(worldMatrix, identityMatrix, angle, [0.0, 1.0, 0.0]);
        mat4.rotate(xRotationMatrix, identityMatrix, angle, [1.0, 0.0, 0.0])
        mat4.rotate(yRotationMatrix, identityMatrix, angle, [0.0, 1.0, 0.0]);
        mat4.mul(worldMatrix, xRotationMatrix, yRotationMatrix);
        //update worldMatrix
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, yRotationMatrix);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //render multiple sets of primitives from array data
        //drawElements(gl.TRIANGLES, cont of points to draw, type, offset from begining)
        gl.drawElements(gl.TRIANGLES, json3Dindices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}