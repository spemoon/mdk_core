define(function (require, exports, module) {
    var $ = require('jquery');
    var ajax = require('../core/ajax');

    var group = function () {
        this.name = ''; // 当前组的name
        this.flag = ''; // 当前组的flag
        this.list = {}; // 正常分组的 {id: name, id: name}
    };

    var config = {
        error:{
            dot:'组名不允许存在逗号',
            network:'网络错误，请稍后再试',
            empty:'组名为空',
            exist:'组名已经存在'
        }
    }
    var helper = {
        getInfo:function (node) {
            return {
                id:node.parent().attr('data-id') || 0,
                name:node.find('.group-name').text()
            };
        },
        /**
         * 提交增加或编辑组
         * @param params
         */
        commit:function (params) {
            var url = params.url;
            var id = params.id;
            var name = params.name;
            var _this = this;
            if (name.length) {
                if (name.indexOf(',') > -1) { // 分组不能含有逗号
                    params.failure && params.failure(config.error.dot, params);
                } else {
                    if (this.hasGroup(name)) { // 分组已经存在
                        params.failure && params.failure(config.error.exist, params);
                    } else {
                        var obj = {
                            name:name
                        };
                        if (id) {
                            obj.gid = id;
                        }
                        ajax.base({
                            url:url,
                            type:'post',
                            data:obj,
                            success:function (data) {
                                if (id) { // 修改组
                                    _this.list[id] = name;
                                } else { // 添加组
                                    _this.list[data.data.id] = data.data.name;
                                }
                                params.success && params.success(data);
                            },
                            failure:function (data) { // 服务端返回失败
                                params.failure && params.failure(data, params);
                            },
                            error:function () { // 网络错误
                                params.failure && params.failure(config.error.network, params);
                            }
                        });
                    }
                }
            } else { // 组名为空
                params.failure && params.failure(config.error.empty, params);
            }
        }
    };

    group.prototype = {
        constructor:group,
        /**
         * 获取初始化数据
         */
        init:function () {
            var list = $('.group-list .group-list-item');
            for (var i = 0, len = list.length - 1; i < len; i++) {
                var info = helper.getInfo(list.eq(i));
                this.list[info.id] = info.name;
            }
            return this;
        },
        /**
         * 重构缓存数据，导入数据时使用
         * @param data
         */
        build: function(data) {
            this.list = {};
            for (var i = 0, len = data.length; i < len; i++) {
                var g = data[i];
                this.list[g.id] = g.name;
            }
        },
        /**
         * 重命名
         * @param params
         * @return {*}
         */
        rename:function (params) {
            params.url = '/group/edit';
            helper.commit.call(this, params);
            return this;
        },
        /**
         * 删除指定id的分组
         * @param id
         */
        del:function (params) {
            var _this = this;
            ajax.base({
                url:'/group/destroy',
                type:'post',
                data:{
                    gid:params.id
                },
                success:function (data) {
                    delete _this.list[params.id]; // 删除组数据
                    params.success && params.success(data);
                },
                failure:function (data) {
                    params.failure && params.failure(data);
                },
                error:function () {
                    params.failure && params.failure(config.error.network);
                }
            });
        },
        /**
         * 是否存在该组
         * @param name
         * @return {Boolean}
         */
        hasGroup:function (name) {
            return !!this.getGroupByName(name);
        },
        /**
         * 添加分组
         * @param params
         *     name: 组名
         *     success(data): 成功回调
         *     failure(msg, params): 失败回调，下面情况会触发
         *         分组不能含有逗号/服务端返回失败/网络错误/组名为空/分组已经存在
         */
        add:function (params) {
            params.url = '/group/create';
            helper.commit.call(this, params);
            return this;
        },
        /**
         * 获取对应组的id
         * @param name
         * @return {*}
         */
        getGroupByName: function(name) {
            for(var key in this.list) {
                if (this.list[key] === name) {
                    return key;
                }
            }
        },
        /**
         * 组移动
         * @param params
         */
        move: function(params) {
            var _this = this;
            ajax.base({
                url:'/group/move',
                type:'post',
                data:{
                    cid:params.cid.join(','),
                    group: params.gid.join(','),
                    status: params.status.join(',')
                },
                success:function (data) {
                    params.success && params.success(data);
                },
                failure:function (data) {
                    params.failure && params.failure(data);
                },
                error:function () {
                    params.failure && params.failure(config.error.network);
                }
            });
        }
    };

    return group;
});