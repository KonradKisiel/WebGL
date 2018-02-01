
    canvas.removeEventListener("mousedown", mouseDownHandler, false);
    canvas.removeEventListener("mousemove", mouseMoveHandler, false);
    canvas.removeEventListener("mouseup", mouseUpHandler, false);

    var mouseDown = false;
    var lastX = 0;

    function mouseDownHandler(ev) {
        mouseDown = true;
        lastX = ev.screenX;
        return true;
    }
    function mouseMoveHandler(ev) {
        if (!mouseDown)
            return false;
        var mdelta = ev.screenX - lastX;
        lastX = ev.screenX;
        currentRotation -= mdelta;
        while (currentRotation < 0)
            currentRotation += 360;
        if (currentRotation >= 360)
            currentRotation = currentRotation % 360;

        requestAnimationFrame(loop);
        return true;
    }

    
    var currentRotation = 0;
    
      function draw() {
        pushMatrix();
        mvRotate(currentRotation,[0,0,1]);
    
        setMatrixUniforms();
    
        // the texture might still be loading
        if (!texturesBound) {
          if (sf.textures.diffuse) {
              if (sf.textures.diffuse.complete) {
                if (sf.textures.diffuse.width > 0 && sf.textures.diffuse.height > 0) {
                  // the texture is ready for binding
                  var texid = gl.createTexture();
                  gl.activeTexture(gl.TEXTURE0);
                  gl.bindTexture(gl.TEXTURE_2D, texid);
                  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                  gl.texImage2D(
                      gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                      sf.textures.diffuse);
                  gl.generateMipmap(gl.TEXTURE_2D);
    
                  gl.uniform1i(tex0Uniform, 0);
                }
    
                texturesBound = true;
              }
          } else {
            texturesBound = true;
          }
        }
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, numVertexPoints);
    
        popMatrix();
      }
    
      draw();


    function mouseUpHandler(ev) {
        mouseDown = false;
    }

    canvas.addEventListener("mousedown", mouseDownHandler, false);
    canvas.addEventListener("mousemove", mouseMoveHandler, false);
    canvas.addEventListener("mouseup", mouseUpHandler, false);

    var activeTouchIdentifier;

    function findActiveTouch(touches) {
        for (var ii = 0; ii < touches.length; ++ii) {
            if (touches.item(ii).identifier == activeTouchIdentifier) {
                return touches.item(ii);
            }
        }
        return null;
    }

    function touchStartHandler(ev) {
        if (mouseDown || ev.targetTouches.length == 0) {
            return;
        }
        var touch = ev.targetTouches.item(0);
        mouseDownHandler(touch);
        activeTouchIdentifier = touch.identifier;
        ev.preventDefault();
    }

    function touchMoveHandler(ev) {
        var touch = findActiveTouch(ev.changedTouches);
        if (touch) {
            mouseMoveHandler(touch);
        }
        ev.preventDefault();
    }

    function touchEndHandler(ev) {
        var touch = findActiveTouch(ev.changedTouches);
        if (touch) {
            mouseUpHandler(touch);
        }
        ev.preventDefault();
    }

    canvas.addEventListener("touchstart", touchStartHandler, false);
    canvas.addEventListener("touchmove", touchMoveHandler, false);
    canvas.addEventListener("touchend", touchEndHandler, false);
    canvas.addEventListener("touchcancel", touchEndHandler, false);


