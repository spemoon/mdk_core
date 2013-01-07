define(function (require, exports, module) {
    var $ = require('jquery');
    var string = require('../core/string');
    var ajax = require('../core/ajax');
    var action = require('../core/dom/action');
    var tpl = {
        add:require('./../../../app/contact/tpl/group_add'),
        item:require('./../../../app/contact/tpl/group_item')
    };

    return function (params) {
        var g = {
            timer:{
                groupEdit:null,
                groupAdd:null
            },
            mainG:params.g,
            group:params.g.group,
            dialog:params.g.dialog,
            load:params.load,
            node:{
                main:params.mainNode
            }
        };

        var helper = {
            /**
             * 提交组增加事件
             * @param e
             */
            submitAddGroup:function (e) {
                clearTimeout(g.timer.groupAdd);
                var li = $('#new_group_item');
                var input = li.find('input').eq(0);
                var name = input.val();
                g.group.add({
                    name:name,
                    success:function (data) {
                        li.hide();
                        li.prev().before(tpl.item.render({
                            id:data.data.id,
                            name:string.code(name),
                            count:0
                        }));
                        li.prev().prev().hover(function (e) {
                            $(this).find('.g-opt').show();
                        }, function (e) {
                            $(this).find('.g-opt').hide();
                        });
                    },
                    failure:function (msg, params) {
                        input.focus();
                    }
                });
            },
            /**
             * 提交组修改事件
             * @param e
             */
            submitEditGroup:function (e) {
                clearTimeout(g.timer.groupEdit);
                var li = $(e.target).parents('li[data-id]');
                var edit = li.find('.edit-group');
                var input = edit.find('input').eq(0);
                var name = input.val();
                var prevName = li.find('.group-name').text();
                if (name == prevName) {
                    edit.hide();
                } else {
                    g.group.rename({
                        name:name,
                        id:li.attr('data-id'),
                        success:function (data) {
                            li.find('.group-name').text(name);
                            edit.hide();
                            helper.modifyListGroup(name, prevName);
                        },
                        failure:function (msg, params) {
                            input.focus();
                        }
                    });
                }
            },
            /**
             * 右侧列表中的数据中的分组信息进行修改
             * @param name
             * @param prevName
             * @param flag true表示是组删除
             */
            modifyListGroup:function (name, prevName, flag) {
                var list = $('#contact_list').find('td.group>span');
                list.each(function (i, n) {
                    var arr = $(n).text().split(',');
                    for (var i = 0, len = arr.length; i < len; i++) {
                        if (arr[i] == prevName) {
                            if (flag == true) {
                                arr.splice(i, 1);
                            } else {
                                arr[i] = name;
                            }
                            $(n).text(arr.join(','));
                            break;
                        }
                    }
                });
            }
        };

        action.listen({
            /**
             * 导航，会执行node上绑定的data-js
             * @param e
             * @param node 当前含有data-js的响应节点
             */
            loadView:function (e, node) {
                g.load(node, g.node.main);
            },
            /**
             * 增加分组
             */
            addGroup:function (e) {
                clearTimeout(g.timer.groupAdd);
                var newItem = $('#new_group_item');
                var input = newItem.find('input').eq(0);
                if (!newItem[0]) {
                    var html = tpl.add.render();
                    $('.group-list ul').append(html);
                    newItem = $('#new_group_item');
                    input = newItem.find('input').eq(0);
                    input.blur(function (e) {
                        g.timer.groupAdd = setTimeout(function () {
                            newItem.hide();
                        }, 128);
                    }).keydown(function (e) {
                            if (e.keyCode == 13) {
                                helper.submitAddGroup(e);
                            }
                        }).click(function (e) {
                            return false;
                        });
                }
                newItem.show();
                input.val('').focus();
            },
            /**
             * 提交分组增加
             */
            submitAddGroup:function (e) {
                helper.submitAddGroup(e);
            },
            /**
             * 放弃分组增加
             */
            cancelAddGroup:function (e) {
                $('#new_group_item').hide();
            },
            /**
             * 删除分组
             */
            delGroup:function (e) {
                var li = $(e.target).parents('li[data-id]');
                var gid = li.attr('data-id');
                if (gid) {
                    g.dialog.confirm({
                        title:'分组删除确认',
                        content:'确定要删除该分组？（删除分组不会删除该分组下的联系人。）',
                        ok:{
                            action:function (e, btn) {
                                g.group.del({
                                    id:gid,
                                    success:function (data) {
                                        var prevName = li.find('.group-name').text();
                                        var count = +li.find('strong').eq(0).text().match(/\d+/)[0];
                                        var lastCount = $('.group-list ul>li:last').find('strong').eq(0);
                                        li.remove();
                                        helper.modifyListGroup('', prevName, true);
                                        lastCount.text('[' + (+lastCount.text().match(/\d+/)[0] + count) + ']'); // 未分组要增加数量
                                    },
                                    failure:function (msg) {

                                    }
                                });
                                this.unrender();
                            }
                        }
                    });
                }
            },
            /**
             * 编辑分组按钮
             */
            editGroup:function (e) {
                var li = $(e.target).parents('li[data-id]');
                var edit = li.find('.edit-group');
                var input = edit.find('input').eq(0);
                var preEdit = $('.group-list .edit-group:visible');
                if(edit[0]) {
                    if(preEdit[0] != edit[0]) {
                        preEdit.hide();
                    }
                } else {
                    if(preEdit[0]) {
                        preEdit.hide();
                    }
                    li.find('.group-list-item').append('<div class="edit-group"><input type="text" class="ipt ipt-3"/><a class="btn btn-sure" href="#" data-action="submitEditGroup">确认</a><a class="btn btn-cancle" href="#" data-action="cancelEditGroup">取消</a></div>');
                    edit = li.find('.edit-group');
                    input = edit.find('input').eq(0);
                    input.blur(function (e) {
                        g.timer.groupEdit = setTimeout(function () {
                            edit.hide();
                        }, 128);
                    }).keydown(function (e) {
                            if (e.keyCode == 13) {
                                helper.submitEditGroup(e);
                            }
                        }).click(function (e) {
                            return false;
                        });
                }
                clearTimeout(g.timer.groupEdit);
                edit.show();
                input.val(li.find('.group-name').text()).focus().select();
            },
            /**
             * 提交分组编辑：
             *     组名不能为空，长度不限
             *     组名没有修改点击保存不发请求
             */
            submitEditGroup:function (e) {
                helper.submitEditGroup(e);
            },
            /**
             * 放弃分组编辑
             */
            cancelEditGroup:function (e) {
                $(e.target).parents('li[data-id]').find('.edit-group').hide();
            }
        });
    };
});