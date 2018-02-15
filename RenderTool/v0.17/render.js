var GL;

function main() {
    var CANVAS = document.getElementById("WebGL_canvas");
    //Reload on orientation change
    window.addEventListener("orientationchange", function () {
        // Announce the new orientation number
        var orientation = window.orientation;
        switch (orientation) {
            case 0:
            case 90:
            case -90: window.location.reload();
                break;
        }
    }, false);
    /*========================= CAPTURE EVENTS ========================= */
    var AMORTIZATION = 0.95;
    var mouseDown = false;
    var scroll = false;

    var old_x, old_y, ZOOM = -8, THETA = 5, PHI = 0.3;

    var dX = 0.1, dY = 0, dZ = -8, zoom = 0;
    var mouseDownHandler = function (e) {
        mouseDown = true;
        old_x = e.pageX, old_y = e.pageY;
        return false;
    };

    var mouseUpHandler = function (e) {
        mouseDown = false;
    };

    var mouseMoveHandler = function (e) {
        if (!mouseDown) return false;
            dX = (e.pageX - old_x) * Math.PI / CANVAS.width,
            dY = (e.pageY - old_y) * Math.PI / CANVAS.height;
            if(!grabOn){
                THETA += dX;
                PHI += dY;
            }
            old_x = e.pageX, old_y = e.pageY;
    };

    function mouseScrollHandler(e) {
        zoom = Math.max(-0.25, Math.min(0.25, (e.wheelDelta || -e.detail)));
        ZOOM = dZ + zoom;
        dZ = Math.max(-16, Math.min(-4, ZOOM));
    }

    CANVAS.addEventListener("mousedown", mouseDownHandler, false);
    CANVAS.addEventListener("mouseup", mouseUpHandler, false);
    CANVAS.addEventListener("mouseout", mouseUpHandler, false);
    CANVAS.addEventListener("mousemove", mouseMoveHandler, false);
    //Mouse scroll listeners
    // IE9, Chrome, Safari, Opera
    CANVAS.addEventListener("mousewheel", mouseScrollHandler, { passive: true });
    // Firefox
    CANVAS.addEventListener("DOMMouseScroll", mouseScrollHandler, { passive: true });


    var activeTouchIdentifier;

    function findActiveTouch(touches) {
        for (var i = 0; i < touches.length; ++i) {
            if (touches.item(i).identifier == activeTouchIdentifier) {
                return touches.item(i);
            }
        }
        return null;
    }

    function touchStartHandler(e) {
        if (mouseDown || e.targetTouches.length == 0) {
            return;
        }
        var touch = e.targetTouches.item(0);
        mouseDownHandler(touch);
        activeTouchIdentifier = touch.identifier;
    }

    function touchMoveHandler(e) {
        var touch = findActiveTouch(e.changedTouches);
        if (touch) {
            mouseMoveHandler(touch);
        }
    }

    function touchEndHandler(e) {
        var touch = findActiveTouch(e.changedTouches);
        if (touch) {
            mouseUpHandler(touch);
        }
    }

    function mouseUpHandler(e) {
        mouseDown = false;
    }


    CANVAS.addEventListener("touchstart", touchStartHandler, { passive: true });
    CANVAS.addEventListener("touchmove", touchMoveHandler, { passive: true });
    CANVAS.addEventListener("touchend", touchEndHandler, false);
    CANVAS.addEventListener("touchcancel", touchEndHandler, false);
    CANVAS.addEventListener("gestured", touchEndHandler, false);

    //************************* PINCH ZOOM ******************************************    
    //https://developer.mozilla.org/en-US/docs/Web/API/Touch_events

    CANVAS.onpointerdown = pointerdown_handler;
    CANVAS.onpointermove = pointermove_handler;

    // Use same handler for pointer{up,cancel,out,leave} events since
    // the semantics for these events - in this app - are the same.
    CANVAS.onpointerup = pointerup_handler;
    CANVAS.onpointercancel = pointerup_handler;
    CANVAS.onpointerout = pointerup_handler;
    CANVAS.onpointerleave = pointerup_handler;

    // Global vars to cache event state
    var evCache = new Array();
    var prevDiff = -1;

    function pointerdown_handler(e) {
        evCache.push(e);
    }

    function pointermove_handler(e) {

        for (var i = 0; i < evCache.length; i++) {
            if (e.pointerId == evCache[i].pointerId) {
                evCache[i] = e;
                break;
            }
        }

        // If two pointers are down, check for pinch gestures
        if (evCache.length == 2) {
            // Calculate the distance between the two pointers
            var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

            if (prevDiff > 0) {
                //zoom = 0.04*(curDiff-prevDiff);
                zoom = Math.max(-0.2, Math.min(0.2, (curDiff - prevDiff)));
                ZOOM = dZ + zoom;
                dZ = Math.max(-16, Math.min(-4, ZOOM));
            }

            // Cache the distance for the next move event 
            prevDiff = curDiff;
        }
    }

    function pointerup_handler(e) {
        remove_event(e);
        // If the number of pointers down is less than two then reset diff tracker
        if (evCache.length < 2) prevDiff = -1;
    }

    function remove_event(e) {
        // Remove this event from the target's cache
        for (var i = 0; i < evCache.length; i++) {
            if (evCache[i].pointerId == e.pointerId) {
                evCache.splice(i, 1);
                break;
            }
        }
    }

    //************************* END OF PINCH ZOOM ****************************************** 

    /*========================= ========================= */

    GL = initWebGL(CANVAS);
    fullscreen(CANVAS);
    initShaders();
    initTexture();
    initJSON();

    var PROJMATRIX = TRAN.get_projection(45, CANVAS.width / CANVAS.height, 1, 100);
    var MOVEMATRIX = TRAN.get_I4();
    var VIEWMATRIX = TRAN.get_I4();

    var _Pmatrix = GL.getUniformLocation(PROGRAM, "u_mProj");
    var _Vmatrix = GL.getUniformLocation(PROGRAM, "u_mView");
    var _Mmatrix = GL.getUniformLocation(PROGRAM, "u_mMov");

    var time_old = 0;
    var dt = 0;
    //****************** FPS COUNTER *************/
    var fps_time = 0;
    var fps_frames = 0;
    var autoRot = 0.001;
    var dom_counter = document.getElementById("FPS_counter");
    var boolTime = false;
    var buffTime = 0;
    var currRot = 0;
    var render = function (time) {

        dt = time - time_old;
        // FPS COUNTER
        fps_time += dt;
        fps_frames++;
        if (fps_time > 1000) {

            var fps = 1000 * fps_frames / fps_time;

            dom_counter.innerHTML = "FPS:" + Math.round(fps);

            fps_time = fps_frames = 0;
        }
        //*****************************************//

        TRAN.set_I4(MOVEMATRIX);

        if (rotate) {
            currRot = time - buffTime;
            autoRot = 0.001 * (currRot);
        }
        else {
            buffTime = time - currRot;
        }

        if (!mouseDown) {
            dX *= AMORTIZATION, dY *= AMORTIZATION;
            if(!grabOn){
                THETA += dX, PHI += dY;
            }else{
                TRAN.translateX(VIEWMATRIX, dX);
                TRAN.translateY(VIEWMATRIX, -dY);
            }
        }
       TRAN.rotateX(MOVEMATRIX, PHI);
       TRAN.rotateY(MOVEMATRIX, THETA + autoRot);
        TRAN.translateZ(VIEWMATRIX, ZOOM);
        time_old = time;

        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
        GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

        GL.drawElements(GL.TRIANGLES, INDICIES_LENGTH, GL.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
}