function checkWebGL(canvas){
    var ctx = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"], gl;
    for(var i=0; i<ctx.length; i++){
        try {gl = canvas.getContext(ctx[i]);}
        catch(e) {}
        if(gl) break;
    }
    if(!gl) alert('Your browser does not support WebGL');
    return gl;
}

function main(){
    var canvas = document.getElementById("WebGL_canvas")
    gl = checkWebGL(canvas);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}