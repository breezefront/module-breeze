define(['jquery'], async function ($) {
    'use strict';

    var scripts = $('script[type="breeze/async-js"]').get().map(script => script.src),
        chunks = _.chunk(scripts, Math.ceil(scripts.length / 3)),
        required = window.required;

    // process inline scripts with resolved dependencies
    required.map((args, i) => {
        if (args[0].every?.(arg => $.breezemap[arg]) && typeof args[1] === 'function') {
            try {
                require(...args);
                required.splice(i, 1);
            } catch (e) {}
        }
    });

    // load async scripts
    for (let chunk of chunks) {
        await new Promise(resolve => {
            setTimeout(async () => {
                await Promise.all(chunk.map($.preloadScript));
                for (let script of chunk) {
                    await $.loadScript(script);
                }
                resolve();
            });
        });
    }

    // process inline scripts
    require.ready = true;
    required.map(args => require(...args));
    required = [];
});
