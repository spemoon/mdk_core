define(function (require, exports, module) {
    var $ = require('jquery');
    var iframe;
    var helper = {
        getHash:function () {
            return location.hash.replace(/^#/, '');
        }
    };
    var supportHash = ('onhashchange' in window) && ((typeof document.documentMode === 'undefined') || document.documentMode == 8);
    var lastHash = helper.getHash();
    var cache = {};
    return {
        listen:function (obj) {
            (function () {
                for (var key in obj) {
                    if (!cache[key]) {
                        cache[key] = obj[key];
                    }
                }
            })();

            if (supportHash) {
                window.onhashchange = function (e) {
                    var prev = e.oldURL;
                    var url = e.newURL;
                    var hash = helper.getHash();
                    if (prev !== url) {
                        for (var key in cache) {
                            if (key === hash) {
                                cache[key](hash, false);
                                if (cache[key].callback) { // 用于set的时候的回调
                                    cache[key].callback();
                                    delete cache[key].callback;
                                }
                            }
                        }
                    }
                };
            } else {
                if (!iframe) {
                    $(function () {
                        var el = $('<iframe tabindex="-1" style="display:none" widht="0" height="0"/>').appendTo(document.body);
                        iframe = el[0].contentWindow;
                        el.bind('load', function () {
                            var hash = helper.getHash();
                            el.unbind('load');
                            var doc = iframe.document;
                            doc.open();
                            doc.write('<!doctype html><html><body>' + hash + '</body></html>');
                            doc.close();
                            setInterval(function () {
                                var hash = helper.getHash();// 主窗口中的hash
                                var historyHash = iframe.document.body.innerText;// 上一次hash
                                if (hash !== lastHash) { // 主窗口hash改变
                                    lastHash = hash;
                                    if (hash !== historyHash) {
                                        doc.open();
                                        doc.write('<!doctype html><html><body>' + hash + '</body></html>');
                                        doc.close();
                                    }
                                    for (var key in cache) {
                                        if (key === hash) {
                                            cache[key](hash, false);
                                            if (cache[key].callback) { // 用于set的时候的回调
                                                cache[key].callback();
                                                delete cache[key].callback;
                                            }
                                        }
                                    }
                                } else if (historyHash !== lastHash) {// 回退/前进
                                    location.hash = historyHash;
                                }
                            }, 50)
                        });
                    });
                }
            }
            (function () { // 初始化触发
                var hash = helper.getHash();
                for (var key in cache) {
                    if (key === hash) {
                        cache[key](hash, true);
                    }
                }
            })();
        },
        set:function (hash, callback) {
            location.hash = '#' + hash;
            if (callback) {
                for (var key in cache) {
                    if (key === hash) {
                        cache[key].callback = callback;
                    }
                }
            }
        }
    }
});