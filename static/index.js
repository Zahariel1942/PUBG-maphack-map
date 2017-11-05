$(function () {
    function resizeCanvas() {
        $('#myCanvas').attr("width", window.innerWidth).attr("height", window.innerHeight);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
})

$(function () {
    // setup context and database connection
    var canvas = $('#myCanvas')[0];
    var ctx = canvas.getContext('2d');
    trackTransforms(ctx);
    var factor = 1;
    var scaledFactor = 1;
    var socket = io();
    var locations = {};
    var mapImage = new Image;
    mapImage.src = "map.jpg"
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
            } else if (players[tracked_player].t == player.t) {
                color = '#0033BB';
            } else {
                color = '#ff0000';
            }
            if (player.hp == 0) {
                color = '#000000';
                drawDot(ctx, player.x, player.y, color);
            } else {
                drawDotWithHp(ctx, player.x, player.y, player.hp, color);
            }
            drawText(ctx, player.x, player.y, i, 'white');
        }
    }

    function drawItems(ctx) {
        if (!locations.items) {
            return;
        }
        var items = locations.items;
        for (var i = items.length - 1; i >= 0; i--) {
            var item = items[i];
            // drawDot(ctx, item.x, item.y, 'red', 1);
            drawText(ctx, item.x, item.y, item.n, 'red');
        }
    }

    function drawVehicles(ctx) {
        if (!locations.vehicles) {
            return;
        }
        var vehicles = locations.vehicles;
        for (var i = vehicles.length - 1; i >= 0; i--) {
            var vehicle = vehicles[i];
            drawText(ctx, vehicle.x, vehicle.y, vehicle.v, 'orange');
        }
    }

    function drawDot(ctx, x, y, color, width) {
        var centerX = game2pix(x);
        var centerY = game2pix(y);
        var radius = 7 / scaledFactor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.lineWidth = width || 5;
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawDotWithHp(ctx, x, y, hp, color) {
        var centerX = game2pix(x);
        var centerY = game2pix(y);

        // 底色
        drawDot(ctx, x, y, color);


        var radius = 7 / scaledFactor;
        var startAngle = 1.5 * Math.PI;
        var endAngle = (((100 - hp) / 100) * 2 * Math.PI) + 1.5 * Math.PI;

        // 扇形
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.closePath();
        ctx.fill();
        startAngle = endAngle;

    }

    function drawText(ctx, x, y, content, color) {
        var centerX = game2pix(x);
        var centerY = game2pix(y);
        ctx.font = '' + 8 / scaledFactor + 'pt Calibri';
        ctx.fillStyle = color;
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
