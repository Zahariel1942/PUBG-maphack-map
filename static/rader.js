function Rader(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    trackTransforms(this.ctx);
    this.scaledFactor = 1;
    this.mapImage = new Image;
    this.mapImage.src = "map.jpg"
    this.focusOffset = {
        X: this.canvas.width / 2,
        Y: this.canvas.height / 2
    };
    var self = this;
    window.addEventListener('resize', function () {
        self.focusOffset = {
            X: self.canvas.width / 2,
            Y: self.canvas.height / 2
        };
    });

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
}

Rader.prototype.map = function () {
    this.ctx.drawImage(this.mapImage, 0, 0);
}

Rader.prototype.clear = function () {
    var p1 = this.ctx.transformedPoint(0, 0);
    var p2 = this.ctx.transformedPoint(this.canvas.width, this.canvas.height);
    this.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
}

Rader.prototype.translate = function (x, y) {
    this.ctx.translate(x, y);
}

Rader.prototype.setZoom = function (scale) {
    var pt = this.ctx.transformedPoint(this.canvas.width / 2, this.canvas.height / 2);
    this.scaledFactor *= scale;
    this.ctx.translate(pt.x, pt.y);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-pt.x, -pt.y);
}

Rader.prototype.setMove = function (offsetX, offsetY) {
    this.translate(offsetX / this.scaledFactor, offsetY / this.scaledFactor);
}

Rader.prototype.setFocus = function (x, y) {
    var pos = this.coords2Pos(x, y);
    this.translate(this.focusOffset.X - pos.X, this.focusOffset.Y - pos.Y);
    this.focusOffset.X = pos.X;
    this.focusOffset.Y = pos.Y;
}

// translates game coords to overlay coords
Rader.prototype.game2Pix = function (p) {
    return p * (8130 / 813000)
}

Rader.prototype.coords2Pos = function (x, y) {
    return {
        X: this.game2Pix(x),
        Y: this.game2Pix(y)
    }
}

Rader.prototype.dot = function (x, y, color, width) {
    var pos = this.coords2Pos(x, y);
    var radius = 7 / this.scaledFactor;
    this.ctx.beginPath();
    this.ctx.arc(pos.X, pos.Y, radius, 0, 2 * Math.PI, false);
    this.ctx.lineWidth = width || 5;
    this.ctx.fillStyle = color || 'red';
    this.ctx.fill();
}

Rader.prototype.pieChart = function (x, y, percent, color) {
    var pos = this.coords2Pos(x, y);
    var radius = 7 / this.scaledFactor;
    var startAngle = 1.5 * Math.PI;
    var endAngle = (percent * 2 * Math.PI) + 1.5 * Math.PI;

    // 扇形
    this.ctx.fillStyle = color || 'gray';
    this.ctx.beginPath();
    this.ctx.moveTo(pos.X, pos.Y);
    this.ctx.arc(pos.X, pos.Y, radius, startAngle, endAngle, false);
    this.ctx.closePath();
    this.ctx.fill();
}

Rader.prototype.text = function (x, y, content, color) {
    var pos = this.coords2Pos(x, y);
    this.ctx.font = '' + 8 / this.scaledFactor + 'pt Calibri';
    this.ctx.fillStyle = color || 'white';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(content, pos.X, pos.Y + (3 / this.scaledFactor));
}

// from https://github.com/jerrytang67/helloworld
Rader.prototype.lineWithAngle = function (x, y, length, width, angle, color) {
    var pos = this.coords2Pos(x, y);
    var anX = 5 * Math.cos(Math.PI * angle / 180.0);
    var anY = 5 * Math.sin(Math.PI * angle / 180.0);

    var x1 = pos.X + anX;
    var y1 = pos.Y + anY;

    var circle1 = {
        x: pos.X,
        y: pos.Y,
        r: 5
    };
    var circle2 = {
        x: x1,
        y: y1,
        r: 0
    };

    var arrow = {
        h: width / this.scaledFactor,
        w: length / this.scaledFactor
    };

    drawArrow(this.ctx, arrow, circle1, circle2, color);

    //draw arrow -- uuaing
    function drawArrow(canvasContext, arrow, ptArrow, endPt, color) {
        var angleInDegrees = getAngleBetweenPoints(ptArrow, endPt);
        var endPt = getPointOnCircle(endPt.r, ptArrow, endPt);
        // first save the untranslated/unrotated context
        canvasContext.save();

        // move the rotation point to the center of the rect    
        canvasContext.translate(endPt.x, endPt.y);
        // rotate the rect
        canvasContext.rotate(angleInDegrees * Math.PI / 180);
        canvasContext.beginPath();
        canvasContext.moveTo(0, 0);

        canvasContext.lineTo(0, -arrow.h);
        canvasContext.lineTo(arrow.w, 0);
        canvasContext.lineTo(0, +arrow.h);
        canvasContext.closePath();
        canvasContext.fillStyle = color;
        canvasContext.lineWidth = 0;
        //canvasContext.stroke();
        canvasContext.fill();

        // restore the context to its untranslated/unrotated state
        canvasContext.restore();
    }

    function getPointOnCircle(radius, originPt, endPt) {
        var angleInDegrees = getAngleBetweenPoints(originPt, endPt);
        // Convert from degrees to radians via multiplication by PI/180        
        var x = radius * Math.cos(angleInDegrees * Math.PI / 180) + originPt.x;
        var y = radius * Math.sin(angleInDegrees * Math.PI / 180) + originPt.y;
        return {
            x: x,
            y: y
        };
    }

    function getAngleBetweenPoints(originPt, endPt) {
        var interPt = {
            x: endPt.x - originPt.x,
            y: endPt.y - originPt.y
        };
        return Math.atan2(interPt.y, interPt.x) * 180 / Math.PI;
    }
}
