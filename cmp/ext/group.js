define(function (require, exports, module) {
    var $ = require('jquery');
    var lang = require('../../util/core/lang');
    var string = require('../../util/core/string');
    var widget = require('../widget');
    var position = require('../../util/core/dom/position');
    var tpl = require('./tpl/group');

    var group = widget.create({
        params:{
            node:null, // 触发节点
            list:{}, // 所有群组数据源{id:name}
            data:{} // 当前数组选择的源{id:status 1半选,2全选}
        },
        tpl:function () {
            return tpl.render({
                list:this.list
            });
        },
        proto:{
            render:function (params) {
                var _this = this;
                this.node = params.node;
                this.list = params.list;
                this.data = params.data;
                this.action = params.action;
                (function () {
                    var html = [];
                    for (var id in _this.list) {
                        html.push('<li data-id="' + id + '" data-action="check"><input type="checkbox" data-action="check"/><label class="checkbox" data-action="check">' + string.code(_this.list[id]) + '</label></li>');
                    }
                    _this.element.find('ul').eq(0).html(html.join(''));
                })();
                (function () {
                    for (var id in _this.data) {
                        var status = _this.data[id];
                        var e = _this.element.find('li[data-id="' + id + '"]').find(':checkbox').eq(0);
                        if (e[0]) {
                            if (status == 1) {
                                e[0].indeterminate = true;
                                e.attr('data-status', 1);
                            } else if (status == 2) {
                                e[0].checked = true;
                            }
                        }
                    }
                })();
                position.pin({
                    element:this.element,
                    x:'left',
                    y:'top'
                }, {
                    element:this.node,
                    x:'left',
                    y:'bottom'
                });
                this._render();
                return this;
            }
        },
        events:[
            {
                check:function (e) {
                    var target = e.target;
                    var node = $(target);
                    var tagName = target.tagName.toUpperCase();
                    var flag = true;
                    if (tagName != 'INPUT') {
                        flag = false;
                        if (tagName == 'LABEL') {
                            node = node.parent().find('input').eq(0);
                            target = node[0];
                        } else {
                            node = node.find('input').eq(0);
                            target = node[0];
                        }
                    }
                    var status = +node.attr('data-status');
                    if (isNaN(status)) {
                        if (!flag) { // 点在非checkbox上
                            target.checked = !target.checked;
                        }
                    } else {
                        status++;
                        status = status % 3;
                        node.attr('data-status', status);
                        if (status == 0) {
                            target.indeterminate = false;
                            target.checked = false;
                        } else if (status == 1) {
                            target.checked = false;
                            target.indeterminate = true;
                        } else if (status == 2) {
                            target.indeterminate = false;
                            target.checked = true;
                        }
                    }
                    return -1;
                },
                submit:function (e) {
                    var list = this.element.find('li[data-id]');
                    var _this = this;
                    var result = {};
                    var selected = [];
                    list.each(function (i, li) {
                        var node = $(li);
                        var id = node.attr('data-id');
                        var checkbox = node.find('input').eq(0);
                        var prevStatus = _this.data[id] || 0; // 原来状态
                        var checked = checkbox[0].checked; // 是否打勾
                        var status;
                        var resultStatus;
                        if (checked) {
                            status = 2;
                        } else {
                            if (checkbox[0].indeterminate) {
                                status = 1
                            } else {
                                status = 0;
                            }
                        }
                        if (status === 2) {
                            if (prevStatus < status) { // 之前是半选或者不选状态，现在全选
                                resultStatus = status;
                            }
                        } else if (status === 0) {
                            if (prevStatus > status) { // 之前是半选或者全选状态，现在不选
                                resultStatus = status;
                            }
                        }
                        if (!lang.isUndefined(resultStatus)) {
                            result[id] = resultStatus;
                        }
                        if (status > 0) {
                            selected.push({
                                id:id,
                                name:_this.list[id],
                                status:status
                            });
                        }
                    });
                    if (lang.isFunction(this.action)) {
                        this.action.call(this, result, selected);
                    }
                }
            },
            {
                node:$(document),
                action:function () {
                    this.unrender();
                }
            },
            {
                action:function () { // 父节点防止冒泡
                    return -1;
                }
            }
        ]
    });

    return group;
});