/*========================= MOUSE EVENTS ========================= */

var mouseDownHandler = function (e) {
    drag = true;
    old_x = e.pageX, old_y = e.pageY;
    return false;
};

var mouseUpHandler = function (e) {
    drag = false;
};

var mouseMoveHandler = function (e) {
    if (!drag) return false;
    dX = (e.pageX - old_x) * Math.PI / CANVAS.width,
        dY = (e.pageY - old_y) * Math.PI / CANVAS.height;
    THETA += dX;
    PHI += dY;
    old_x = e.pageX, old_y = e.pageY;
};

function mouseScrollHandler(e) {
    zoom = Math.max(-0.25, Math.min(0.25, (e.wheelDelta || -e.detail)));
    ZOOM = dZ + zoom;
    dZ = Math.max(-16, Math.min(-4, ZOOM));
}

/*========================= TOUCH EVENTS ========================= */

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

    //************************* PINCH ZOOM EVENTS **********************// 

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