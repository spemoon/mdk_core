define(function(require, exports, module) {
    var $ = require('jquery');
    var lang = require('../../../util/core/lang');
    var ajax = require('../../../util/core/ajax');
    var string = require('../../../util/core/string');
    var widget = require('../../widget');
    var mask = require('../../core/mask');
    var mVar = require('../../../util/core/dom/mVar');
    var position = require('../../../util/core/dom/position');

    var html5upload = require('../../../util/core/dom/html5/upload');
    var swfupload = require('../../../util/core/dom/html5/swfupload-my');

    var tpl = require('./tpl');
    var itemTpl = require('./item');

    var config = {
        url: {
            domain: 'http://api.simulate.momo.im/',
            get: '/photo/uploadToken'
        },
        appId: 12
    };

    var token = '';
    var xhr = ajax.single('getUploadToken');
    var uploadUrl; // 上传地址
    var total = 0; // 总大小
    var statusObj = {}; // 上传进度对象，结构为 id: {uploaded:, size:}

    var helper = {
        upload: {
            html5Button: function(id, obj, cls) {
                $('#' + id).replaceWith('<a class="' + cls + '" href="javascript:;" id="' + id + '"><input type="file" multiple="true"/></a>');
                $('#' + id + '>input').change(function() {
                    var files = this.files;
                    obj.add(files);
                });
            },
            html5Inc: function() {
                var _this = this;
                var obj = new html5upload({
                    url: uploadUrl,
                    fileName: 'upfile',
                    fileType: '*.jpg;*.png',
                    dragable: false,
                    limit: 0,
                    max: 3, // 并发上传
                    maxSize: '10M',
                    zeroSize: function(file) {
                        helper.failureAdd.call(_this, file, '空文件', true);
                    },
                    overSize: function(file, size) {
                        helper.failureAdd.call(_this, file, '图片超过' + size);
                    },
                    notAllowType: function(file) {
                        helper.failureAdd.call(_this, file, '类型不允许', true);
                    },
                    resCheck: function(json) {
                        return json && json.id;
                    }
                });

                $(obj).bind({
                    successAdd: function(event, file, files) {
                        helper.successAdd.call(_this, file);
                        helper.getUrl.call(_this, function() {
                            obj.setUploadUrl(config.url.domain + 'mocloud/file_upload_once.json?app_id=' + config.appId + '&web_token=' + token);
                            obj.upload();
                        });
                    },
                    progress: function(event, e, file, loaded, all) {
                        helper.progress.call(_this, file, loaded, all);
                    },
                    success: function(event, file, data) {
                        helper.success.call(_this, file, data);
                    },
                    failure: function(event, file, data) {
                        helper.failure.call(_this, file, data.error.split(':')[1]);
                    },
                    finish: function(event, file) {
                        helper.finish.call(_this, file);
                    },
                    complete: function(event, file) {
                        helper.complete.call(_this, file);
                    }
                });
                helper.upload.html5Button.call(this, 'upload_photo_btn', obj, 'upload-select-btn');
                return obj;
            },
            swfInc: function(id, text) {
                var maxSize = this.maxSize + 'B';
                var _this = this;
                var obj = new swfupload({
                    id: id,
                    url: uploadUrl,
                    flash: '/public/swf/swfupload.swf',
                    type: '*.jpg;*.png;*.JPG;*.PNG',
                    desc: '选择照片',
                    img: text ? '' : '/public/theme/default/images/upload/btn.png',
                    fileName: 'upfile',
                    data: {},
                    multi: true,
                    text: text || '',
                    width: 72,
                    height: 23,
                    limit: 0,
                    size: '10MB',
                    zeroSize: function(file) {
                        helper.failureAdd.call(_this, file, '空文件', true);
                    },
                    overSize: function(size, file) {
                        helper.failureAdd.call(_this, file, '图片超过' + size);
                    },
                    notAllowType: function(file) {
                        helper.failureAdd.call(_this, file, '类型不允许', true);
                    },
                    successAdd: function(file) {
                        helper.successAdd.call(_this, file);
                        helper.getUrl.call(_this, function() {
                            obj.setUploadUrl(config.url.domain + 'mocloud/file_upload_once.json?app_id=' + config.appId + '&web_token=' + token);
                            obj.upload();
                        });
                    },
                    progress: function(file, loaded, all) {
                        helper.progress.call(_this, file, loaded, all);
                    },
                    success: function(file, data) {
                        data = $.parseJSON(data);
                        if(data && data.id) {
                            helper.success.call(_this, file, data);
                        } else {
                            helper.failure.call(_this, file, data.error.split(':')[1]);
                        }
                    },
                    error: function(file, code, data) {
                    },
                    finish: function(file) {
                        helper.finish.call(_this, file);
                    },
                    complete: function(file) {
                        helper.complete.call(_this, file);
                    }
                });
                return obj;
            }
        },
        getUrl: function(callback) {
            var _this = this;
            if(token) {
                callback.call(_this, token);
            } else {
                xhr.send({
                    url: config.url.get,
                    success: function(data) {
                        token = data.data.token;
                        config.url.domain = data.data.domain;
                        config.appId = data.data.appid;
                        callback.call(_this, token);
                        setTimeout(function() {
                            token = null;
                        }, (data.data.alive - 60) * 1000);
                    }
                });
            }
        },
        cut: function(str) {
            if(string.blength(str) > 20) {
                str = string.cut(str, 7, true) + '...' + string.cut(str, 7, {
                    dir: 'right',
                    fullSharp: true
                });
            }
            return str;
        },
        add: function(file) {
            var node = this.element;
            var panel = node.find('.photo-panel').eq(0);
            var bar = node.find('.upload-option').eq(0);
            var list = panel.find('ul').eq(0);
            list.show();
            panel.find('.select').eq(0).hide();
            bar.find('.upload-more').eq(0).show();
            list.append(itemTpl.render({
                image: {
                    name: helper.cut(file.name)
                }
            }));
            var item = list.children('li:last');
            item.hover(function() {
                item.find('.icon-del').eq(0).show();
            }, function() {
                item.find('.icon-del').eq(0).hide();
            });
            return item;
        },
        successAdd: function(file) {
            var node = this.element;
            var bar = node.find('.upload-option').eq(0);

            var item = helper.add.call(this, file);
            item.attr('data-index', file.index);

            bar.find('a.btn').eq(0).addClass('btn-dis');
            bar.find('a.btn').eq(1).show(); // 显示取消按钮
            bar.find('.progress-panel').eq(0).hide(); // 处理总进度
        },
        failureAdd: function(file, msg, flag) {
            var item = helper.add.call(this, file);
            item.find('.photo-tip').eq(0).text(msg).show();
            if(flag === true) {
                item.find('img').eq(0).hide();
            }
        },
        progress: function(file, loaded, all) {
            var item = helper.getItem.call(this, file.index);
            var progress = item.find('.progress-bar').eq(0);
            progress.show();
            progress.children('.bar').eq(0).width(loaded / all * 100 + '%');
        },
        progressAll: function() {

        },
        success: function(file, data) {
            var item = helper.getItem.call(this, file.index);
            item.find('img').eq(0).attr('src', data.src);
            item.find('.photo-name').eq(0).hide();
            item.attr('data-id', data.id);
        },
        failure: function(file, msg) {
            var item = helper.getItem.call(this, file.index);
            item.find('.photo-tip').eq(0).text(msg).show();
        },
        finish: function(file) {
            var item = helper.getItem.call(this, file.index);
            var progress = item.find('.progress-bar').eq(0);
            progress.hide();
        },
        complete: function() {
            var node = this.element;
            var bar = node.find('.upload-option').eq(0);
            bar.find('a.btn').eq(0).removeClass('btn-dis');
            bar.find('a.btn').eq(1).hide();
        },
        getItem: function(index) {
            return this.element.find('.photo-panel ul>li[data-index="' + index + '"]').eq(0);
        }
    };

    var upload = widget.create({
        params: {
        },
        tpl: function() {
            return tpl.render();
        },
        afterInit: function() {
            var _this = this;
            if(html5upload.isSupportHTML5Upload) {
                this.upload = helper.upload.html5Inc.call(this);
                helper.upload.html5Button.call(this, 'upload_more_photo_btn', this.upload, 'upload-more');
            } else {
                this.upload = helper.upload.swfInc.call(this, 'upload_photo_btn');
                this.upload2 = helper.upload.swfInc.call(this, 'upload_more_photo_btn', '上传更多照片');
            }
        },
        afterUnrender: function() {
            this._mask.unrender();
            this.reset();
        },
        proto: {
            render: function(params) {
                this._mask = new mask({
                    params: {
                        opacity: 0.01
                    }
                }).init();
                this._mask.render('');
                position.center(this.element);
                this.element.css('z-index', mVar.zIndex());
                this._render();
                return this;
            },
            /**
             * 重置：
             * 上传对象重置，视图方面维护成最开始的状态
             */
            reset: function() {
                var node = this.element;
                var panel = node.find('.photo-panel').eq(0);
                var bar = node.find('.upload-option').eq(0);

                panel.find('.select').eq(0).show();
                panel.find('ul').eq(0).hide().html('');

                bar.find('a.btn').eq(0).addClass('btn-dis').show();
                bar.find('a.btn').eq(1).show();
                bar.find('.upload-more').eq(0).hide();
                bar.find('.progress-panel').eq(0).hide();

                this.upload.reset();
                if(this.upload2) {
                    this.upload2.reset();
                }
            }
        },
        events: [
            {
                /**
                 * 删除一个上传好的文件
                 */
                del: function(e, node) {
                    var item = node.parents('li');
                    var list = item.parent();
                    item.remove();
                    if(list.children('li').length == 0) {
                        this.reset();
                    }
                },
                /**
                 * 提交
                 */
                submit: function(e, node) {

                },
                /**
                 * 放弃
                 */
                cancel: function(e, node) {

                },
                close: function(e, node) {
                    this.unrender();
                }
            },
            {
                node: $(window),
                type: 'resize',
                action: function(e) {
                    position.center(this.element);
                }
            },
            {
                action: function() { // 父节点防止冒泡
                    return -1;
                }
            }
        ]
    });

    return upload;
});