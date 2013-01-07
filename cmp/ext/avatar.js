define(function (require, exports, module) {
    var $ = require('jquery');
    var lang = require('../../util/core/lang');
    var widget = require('../widget');
    var position = require('../../util/core/dom/position');
    var drag = require('../../util/core/dom/drag');
    var resize = require('../../util/core/dom/resize');
    var upload = require('../../util/core/dom/html5/upload-facade');
    var slider = require('../core/slider');
    var tpl = require('./tpl/avatartpl');

    var helper = {
        show:{
            /**
             * 分为4块：tip/select/upload/edit
             * 有传入则显示，其他隐藏
             */
            comm:function () {
                this.element.find('.tip-error').hide();
                this.element.find('.select').hide();
                this.element.find('.uploading').hide();
                this.element.find('.edit').hide();
                for (var i = 0, len = arguments.length; i < len; i++) {
                    var s = arguments[i];
                    if (s === 'edit') {
                        this.element.find('.edit').show();
                        this.element.find('.upload').hide();
                    } else {
                        if (s === 'tip') {
                            this.element.find('.tip-error').show();
                        } else if (s === 'select') {
                            this.element.find('.select').show();
                        } else if (s === 'progress') {
                            this.element.find('.uploading').show();
                        }
                        this.element.find('.upload').show();
                    }
                }
                helper.center.call(this);
            },
            render:function () {
                helper.show.comm.call(this, 'select');
            },
            success:function (data) {
                if(!data) {
                    data = {
                        src: 'http://localhost/momo_cloud/public/theme/default/images/12.jpg' // 原来的头像地址
                    }
                }
                helper.show.comm.call(this, 'edit');
                this.element.find('.photo>img').attr('src', data.src);
            },
            progress:function () {
                helper.show.comm.call(this, 'progress');
            },
            failure:function () {
                helper.show.comm.call(this, 'select', 'tip');
            }
        },
        center:function () {
            position.center(this.element);
        }
    };

    var avatar = widget.create({
        tpl:function () {
            return tpl.render({
                id:this.id
            });
        },
        firstRender:function () {
            var _this = this;
            this.upload = new upload({
                url:'upload.php', // 服务端处理
                fileName:'', // 后端接收文件的域
                multi:false, // 是否允许一次性选择多个，默认true
                button:'upload_btn_' + this.id, // 上传的按钮id字符串

                flash:'http://localhost/momo_cloud/public/swf/swfupload.swf',
                image:'http://localhost/momo_cloud/public/theme/default/app/images/upload/btn.png', // 背景图片设置

                fileType:'*.jpg;*.gif;*.png;*.jpeg', // 文件类型，默认*
                limit:1, // 文件数量限制
                maxSize:'5M', // 文件大小限制，b/k/m/g/t为单位的字符串
                data:{ // 附加post参数
                },
                successAdd:function (file) {
                    helper.show.progress.call(_this);
                },
                failureAdd:function (file) {
                    helper.show.failure.call(_this);
                },
                progress:function (file, loaded, total) {
                    _this.element.find('.progress-point').width((loaded / total) * 100 + '%')
                },
                success:function (file, data) {
                    helper.show.success.call(_this, data.data);
                },
                failure:function (file, data) {
                    helper.show.failure.call(_this);
                },
                finish: function() {
                    _this.upload.reset();
                }
            });

            this.slider = new slider({
                renderTo: this.element.find('.slider-box').eq(0),
                params: {
                    afterSetValue: function(val) {

                    }
                }
            });
            this.slider.init().render();
        },
        afterRender:function () {
            helper.show.render.call(this);
            this.slider.setValue(100);
        },
        afterUnrender: function() {
            this.upload.reset();
        },
        events:[
            {
                close:function () { // 关闭组件
                    this.unrender();
                },
                upload: function() { // 切到上传
                    helper.show.render.call(this);
                },
                edit: function() { // 切到编辑
                    helper.show.success.call(this);
                },
                zoomOut: function() { // 缩小图
                    this.slider.setValue(this.slider.getValue() - 5);
                },
                zoomIn: function() { // 放大图
                    this.slider.setValue(this.slider.getValue() + 5);
                },
                zoomReset: function() { // 恢复至100
                    this.slider.setValue(100);
                }
            },
            {
                node:$(window),
                type:'resize',
                action:function () {
                    helper.center.call(this);
                }
            },
            {
                node:$(document),
                type:'keyup',
                action:function (e) {
                    if (e.keyCode == 27) {
                        this.unrender();
                    }
                }
            }
        ]
    });

    return avatar;
});