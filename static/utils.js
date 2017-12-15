var Utils = {
    getParameterByName: function (name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    MinsCounter: function () {
        var Counter = function () {
            this.count = 0;
            this.last = 0;

            function clear() {
                this.last = this.count;
                this.count = 0;
            }
            setInterval(clear.bind(this), 1000 * 1);
        }
        Counter.prototype.getPerSec = function () {
            return this.last;
        }
        Counter.prototype.update = function () {
            this.count++;
        }
        return new Counter();
    }
}
