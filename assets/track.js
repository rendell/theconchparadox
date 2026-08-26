/* The Conch Paradox — bookmark / print-collateral source tracking.
 * Iteration: 1
 *
 * GitHub Pages is static and gives you no server logs, so counting happens
 * client-side against GoatCounter (free, cookieless, no consent banner needed).
 *
 * SETUP: create a free site at https://www.goatcounter.com/, then put your
 * site code below. Until you do, SITE_CODE stays null and every function here
 * degrades to a plain redirect — nothing breaks, nothing is counted.
 */
(function (global) {
  'use strict';

  var SITE_CODE = null;               // e.g. 'conchparadox'  <-- set this
  var FALLBACK_MS = 700;              // never make a scanner wait longer than this

  function endpoint(path, title) {
    if (!SITE_CODE) return null;
    return 'https://' + SITE_CODE + '.goatcounter.com/count'
      + '?p=' + encodeURIComponent(path)
      + '&t=' + encodeURIComponent(title || path)
      + '&r=' + encodeURIComponent(document.referrer || '');
  }

  /* Fire a counting pixel, then run done() as soon as it resolves or times out. */
  function ping(path, title, done) {
    var url = endpoint(path, title);
    if (!url) { done(); return; }

    var finished = false;
    function finish() { if (!finished) { finished = true; done(); } }

    var img = new Image(1, 1);
    img.onload = finish;
    img.onerror = finish;
    img.src = url;
    setTimeout(finish, FALLBACK_MS);
  }

  var TCPTrack = {
    /* Used by the /go/<src>/ landing pages that QR codes point at. */
    go: function (src, target) {
      var dest = (target || '/buy.html') + '?src=' + encodeURIComponent(src);
      ping('/go/' + src, 'Scan: ' + src, function () {
        location.replace(dest);
      });
    },

    /* Used by buy.html to record which placement a visitor arrived from,
     * and to keep that attribution if they wander around the site first. */
    attribute: function () {
      var src = null;
      try {
        var m = /[?&]src=([^&#]+)/.exec(location.search);
        if (m) src = decodeURIComponent(m[1]);
        if (src) sessionStorage.setItem('tcp_src', src);
        else src = sessionStorage.getItem('tcp_src');
      } catch (e) { /* private mode: attribution is best-effort */ }

      if (src) ping('/buy/from/' + src, 'Buy page from ' + src, function () {});
      return src;
    },

    /* Call on any outbound retail link so you can see which channel converts. */
    outbound: function (channel) {
      var src = null;
      try { src = sessionStorage.getItem('tcp_src'); } catch (e) {}
      ping('/out/' + channel + (src ? '/' + src : ''), 'Outbound: ' + channel, function () {});
    }
  };

  global.TCPTrack = TCPTrack;
})(window);
