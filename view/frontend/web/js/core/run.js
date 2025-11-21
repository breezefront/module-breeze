define(['jquery'], async function ($) {
    'use strict';

    var scripts = $('script[type="breeze/async-js"]').get().map(script => script.src),
        chunks = _.chunk(scripts, Math.ceil(scripts.length / 3)),
        required = window.required;

    // process inline scripts with resolved dependencies
    required = required.filter(args => {
        if (args[0].every?.(arg => $.breezemap.__has(arg)) && typeof args[1] === 'function') {
            try {
                require(...args);
                return false;
            } catch (e) {}
        }
        return true;
    });

    await new Promise($.rafraf);
    await $.breeze.idle();

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
    required.map(args => setTimeout(() => {
        require(...args);
    }));
    required = [];
});
