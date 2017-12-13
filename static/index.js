$(function () {
    function onResize() {
        var height = window.innerHeight;
        var is_safari = navigator.userAgent.indexOf("Safari") > -1;

        if ((navigator.userAgent.match(/iPhone/i)) ||
            (navigator.userAgent.match(/iPod/i))) {
            if (is_safari) {
                height += 80;
            }
        }
        $('#rader').attr("width", window.innerWidth).attr("height", height);
    }
    window.addEventListener('resize', onResize);
    onResize();

    // 禁止移动端弹性webview
    document.ontouchmove = function (event) {
        event.preventDefault();
    }
})

$(function () {
    var rader = new Rader($('#rader')[0]);
    var socket = io();
    var locations = {};
    var trackPlayerIndex = parseInt(Utils.getParameterByName('id') || 0);

    // 手势支持
    var hammertime = new Hammer.Manager($('.container')[0]);
    hammertime.add(new Hammer.Pan({
        threshold: 0
    }));
    hammertime.add(new Hammer.Pinch({
        threshold: 0
    }));

    // 拖动
    var lastDelta = {
        x: 0,
        y: 0
    }
    hammertime.on('panmove', function (ev) {
        rader.setMove(ev.deltaX - lastDelta.x, ev.deltaY - lastDelta.y);
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
    var lastScale = 0;
    hammertime.on('pinchmove', function (ev) {
        var size = 0.6;
        if (lastScale > ev.scale) {
            size = -size;
        }
        rader.setZoom(Math.pow(1.1, size));
        lastScale = ev.scale;
        redraw();
    });
    hammertime.on('pinchend', function () {
        lastScale = 0;
    });

    // 鼠标滚轮缩放
    $('.container').on("mousewheel DOMMouseScroll", function (e) {
        var evt = e.originalEvent;
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) {
            rader.setZoom(Math.pow(1.1, delta));
            redraw();
        }
        return evt.preventDefault() && false;
    });

    socket.on('update', function (snapshot) {
        locations = snapshot;
        redraw();
    });

    function redraw() {
        rader.clear();

        // 视角追踪
        if (locations.players && locations.players[trackPlayerIndex]) {
            var player = locations.players[trackPlayerIndex];
            rader.setFocus(player.x, player.y);
        }
        // draw map
        rader.map();

        drawPlayers();
        drawItems();
        drawVehicles();
    }

    function drawPlayers() {
        if (!locations.players) {
            return;
        }
        var players = locations.players;
        for (var i = players.length - 1; i >= 0; i--) {
            var player = players[i];
            var color = "";
            if (i == trackPlayerIndex) {
                color = '#00BB00';
            } else if (players[trackPlayerIndex].t == player.t) {
                color = '#0033BB';
            } else {
                color = '#ff0000';
            }
            if (player.hp == 0) {
                color = '#000000';
                rader.dot(player.x, player.y, color);
            } else {
                rader.lineWithAngle(player.x, player.y, 15, 6, player.r, color);
                rader.dot(player.x, player.y, color);
                rader.pieChart(player.x, player.y, ((100 - player.hp) / 100), 'gray')
            }
            rader.text(player.x, player.y, i, 'white');
        }
    }

    function drawItems() {
        if (!locations.items) {
            return;
        }
        var items = locations.items;
        for (var i = items.length - 1; i >= 0; i--) {
            var item = items[i];
            rader.text(item.x, item.y, item.n, 'red');
        }
    }

    function drawVehicles() {
        if (!locations.vehicles) {
            return;
        }
        var vehicles = locations.vehicles;
        for (var i = vehicles.length - 1; i >= 0; i--) {
            var vehicle = vehicles[i];
            rader.text(vehicle.x, vehicle.y, vehicle.v, 'orange');
        }
    }
});
