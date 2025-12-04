define(['jquery'], async function ($) {
    'use strict';

    var scripts = $('script[type="breeze/async-js"]').get().map(script => script.src),
        chunks = _.chunk(scripts, Math.ceil(scripts.length / 3)),
        requiredCopy = window.required.slice();

    await new Promise($.rafraf);

    // process inline scripts with resolved dependencies (scroll reveal)
    window.required = [];
    requiredCopy.forEach(args => {
        if (args[0].every?.(arg => $.breezemap.__has(arg)) && typeof args[1] === 'function') {
            try {
                require(...args);
                return;
            } catch (e) {}
        }
        window.required.push(args);
    });

    // load async scripts
    for (let chunk of chunks) {
        await Promise.all(chunk.map($.preloadScript));
        for (let script of chunk) {
            await $.loadScript(script);
        }
        await $.sleep(0);
    }

    // process inline scripts
    require.ready = true;
    window.required.map(args => setTimeout(() => {
        require(...args);
    }));
    window.required = [];
});
