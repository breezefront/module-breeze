/* global Cookies */
window.breeze = window.breeze || {};
window.breeze.cookies = Cookies.withAttributes($.extend({
    path: '/',
    domain: null,
    secure: true,
    expires: null,
    lifetime: null,
    samesite: 'strict'
}, window.cookiesConfig || {}));
