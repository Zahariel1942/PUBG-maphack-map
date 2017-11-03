$(function () {
    // setup context and database connection
    var canvas = $('#myCanvas')[0];
    var ctx = canvas.getContext('2d');
    var factor = 1;
    var scaledFactor = 1;
    var socket = io();
    var locations = {};
    var mapImage = new Image;
    mapImage.src = "map.jpg"
    var lastloc;
    var tracked_player = parseInt(getParameterByName('id') || 0);
    var separated = {};
    var viewPointOffset = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };

    window.addEventListener('resize', function () {
        viewPointOffset = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    });
    var drawing = false;



    trackTransforms(ctx);

    socket.on('update', function (snapshot) {
        locations = snapshot;
        if (!drawing) {
            redraw();
        }
    });

    function redraw() {
        drawing = true;
        // Clear the entire canvas
        var p1 = ctx.transformedPoint(0, 0);
        var p2 = ctx.transformedPoint(canvas.width, canvas.height);
        ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        // ctx.rect(20, 20, 20, 20);
        // ctx.fillStyle = "green";
        // ctx.fill();
        // return;

        // 视角追踪
        if (locations.players && locations.players[tracked_player]) {
            var player = locations.players[tracked_player];
            var centerX = game2pix(player.x);
            var centerY = game2pix(player.y);

            // 相对于上次偏移了多少？
            ctx.translate(viewPointOffset.x - centerX, viewPointOffset.y - centerY);
            viewPointOffset.x = centerX;
            viewPointOffset.y = centerY;
        }
        // draw map
        ctx.drawImage(mapImage, 0, 0);

        drawPlayers(ctx);
        drawItems(ctx);
        drawVehicles(ctx);
        setTimeout(function () {
            drawing = false;
        }, 0);
    }

    function drawPlayers(ctx) {
        if (!locations.players) {
            return;
        }
        var players = locations.players;
        for (var i = players.length - 1; i >= 0; i--) {
            var player = players[i];
            var color = "";
            if (i == tracked_player) {
                color = '#00BB00';
            } else {
                color = players[0].t == player.t ? '#0033BB' : '#ff0000';
            }
            drawDot(ctx, player.x, player.y, color);
            drawText(ctx, player.x, player.y, i);
        }
    }

    function drawItems(ctx) {
        if (!locations.items) {
            return;
        }
        var items = locations.items;
        for (var i = items.length - 1; i >= 0; i--) {
            var item = items[i];
            drawText(ctx, item.x, item.y, item.n);
        }
    }

    function drawVehicles(ctx) {
        if (!locations.vehicles) {
            return;
        }
        var vehicles = locations.vehicles;
        for (var i = vehicles.length - 1; i >= 0; i--) {
            var vehicle = vehicles[i];
            drawText(ctx, vehicle.x, vehicle.y, vehicle.v);
        }
    }

    function drawDot(ctx, x, y, color) {
        var centerX = game2pix(x);
        var centerY = game2pix(y);
        var radius = 7 / scaledFactor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.lineWidth = 5;
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawText(ctx, x, y, content) {
        var centerX = game2pix(x);
        var centerY = game2pix(y);
        ctx.font = '' + 8 / scaledFactor + 'pt Calibri';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(content, centerX, centerY + (3 / scaledFactor));
    }

    // 禁止移动端弹性webview
    document.ontouchmove = function (event) {
        event.preventDefault();
    }

    var hammertime = new Hammer.Manager(canvas);
    hammertime.add(new Hammer.Pan({
        threshold: 0
    }));
    hammertime.add(new Hammer.Pinch({
        threshold: 0
    }))


    // 拖动
    var lastDelta = {
        x: 0,
        y: 0
    }
    hammertime.on('panmove', function (ev) {
        ctx.translate(ev.deltaX - lastDelta.x, ev.deltaY - lastDelta.y);
        lastDelta.x = ev.deltaX;
        lastDelta.y = ev.deltaY;
        redraw();
    });
    hammertime.on('panend', function (ev) {
        lastDelta = {
            x: 0,
            y: 0
        }
    });

    // 缩放
    // 手势
    var lastScale = 0;
    hammertime.on('pinchmove', function (ev) {
        zoomByScale(lastScale + (lastScale - ev.scale));
        lastScale = ev.scale;
    });

    // 滚轮
    function mouseScroll(evt) {
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) {
            zoomByScale(Math.pow(scaleFactor, delta));
        }
        return evt.preventDefault() && false;
    }
    canvas.addEventListener('DOMMouseScroll', mouseScroll, false);
    canvas.addEventListener('mousewheel', mouseScroll, false);

    var scaleFactor = 1.1;

    function zoomByScale(scale) {
        scaledFactor *= scale;
        var pt = ctx.transformedPoint(window.innerWidth / 2, window.innerHeight / 2);
        ctx.translate(pt.x, pt.y);
        ctx.scale(scale, scale);
        ctx.translate(-pt.x, -pt.y);
        redraw();
    }

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    // translates game coords to overlay coords
    function game2pix(p) {
        return p * (8130 / 813000)
    }

    function drawStrokedText(text, x, y, fillcolor) {
        ctx.fillStyle = 'black';
        ctx.fillText(text, x - 1 / scaledFactor, y);
        ctx.fillText(text, x, y - 1 / scaledFactor);
        ctx.fillText(text, x + 1 / scaledFactor, y);
        ctx.fillText(text, x, y + 1 / scaledFactor);
        ctx.fillStyle = fillcolor;
        ctx.fillText(text, x, y);
    }

    function intersects(a, b) {
        if (a.x > (b.x + b.w) || b.x > (a.x + a.w)) //beside
            return false;
        if ((a.y + a.h) < b.y || (b.y + b.h) < a.y) //above
            return false;
        return true;
    }

    function separate() {
        var a, b; // to hold any two items that are overlapping
        var dx, dy, dxa, dxb, dya, dyb; // holds delta values of the overlap

        do {
            var touching = false; // a boolean flag to keep track of touching items
            for (var i = 0; i < separated.length; i++) {
                a = separated[i];
                for (var j = i + 1; j < separated.length; j++) { // for each pair of items
                    b = separated[j];
                    if (intersects(a, b)) {
                        touching = true; //iterate again

                        //calculate the minimum movement delta
                        dx = Math.min((a.x + a.w) - b.x + 1, a.x - (b.x + b.w) - 1);
                        dy = Math.min((a.y + a.h) - b.y + 1, a.y - (b.y + b.h) - 1);

                        // only keep the smallest delta, multiply width as 
                        // text is always longer than tall so it wont only stack vertical
                        (Math.abs(dx) < (2.25 * Math.abs(dy))) ? dy = 0: dx = 0;

                        // create a delta for each rectangle as half the whole delta.
                        dxa = -dx / 2;
                        dxb = dx + dxa;

                        // same for y
                        dya = -dy / 2;
                        dyb = dy + dya;

                        // shift both rectangles
                        separated[i].x += dxa;
                        separated[i].y += dya;

                        separated[j].x += dxb;
                        separated[j].y += dyb;
                    }
                }
            }
        } while (touching); // loop until no rectangles are touching
    }

    // Adds ctx.getTransform() - returns an SVGMatrix
    // Adds ctx.transformedPoint(x,y) - returns an SVGPoint
    function trackTransforms(ctx) {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        var xform = svg.createSVGMatrix();
        ctx.getTransform = function () {
            return xform;
        };

        var savedTransforms = [];
        var save = ctx.save;
        ctx.save = function () {
            savedTransforms.push(xform.translate(0, 0));
            return save.call(ctx);
        };
        var restore = ctx.restore;
        ctx.restore = function () {
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };

        var scale = ctx.scale;
        ctx.scale = function (sx, sy) {
            xform = xform.scaleNonUniform(sx, sy);
            return scale.call(ctx, sx, sy);
        };
        var rotate = ctx.rotate;
        ctx.rotate = function (radians) {
            xform = xform.rotate(radians * 180 / Math.PI);
            return rotate.call(ctx, radians);
        };
        var translate = ctx.translate;
        ctx.translate = function (dx, dy) {
            xform = xform.translate(dx, dy);
            return translate.call(ctx, dx, dy);
        };
        var transform = ctx.transform;
        ctx.transform = function (a, b, c, d, e, f) {
            var m2 = svg.createSVGMatrix();
            m2.a = a;
            m2.b = b;
            m2.c = c;
            m2.d = d;
            m2.e = e;
            m2.f = f;
            xform = xform.multiply(m2);
            return transform.call(ctx, a, b, c, d, e, f);
        };
        var setTransform = ctx.setTransform;
        ctx.setTransform = function (a, b, c, d, e, f) {
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(ctx, a, b, c, d, e, f);
        };
        var pt = svg.createSVGPoint();
        ctx.transformedPoint = function (x, y) {
            pt.x = x;
            pt.y = y;
            return pt.matrixTransform(xform.inverse());
        }
    }
});
