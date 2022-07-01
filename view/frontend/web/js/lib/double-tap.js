(function () {
    'use strict';

    var lastTime = 0;

    document.body.addEventListener('touchstart', (e) => {
        var curTime = new Date().getTime(),
            duration = curTime - lastTime;

        if (e.touches.length === 1 && duration < 300) {
            e.target.dispatchEvent(new PointerEvent('dbltap', {
                bubbles: true,
                cancelable: true,
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            }));
        }

        lastTime = curTime;
    });
})();
