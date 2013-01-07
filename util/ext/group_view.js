define(function (require, exports, module) {
    var $ = require('jquery');
    var string = require('../core/string');
    var tpl = require('../../../app/contact/tpl/group_item');

    var r = {
        /**
         * 修复左侧分组列表的联系人数量
         * @param node 对应分组的数量节点
         * @param subCount 减掉的数量
         */
        fixCount:function (node, subCount) {
            var prevCount = +node.text().match(/\d+/)[0];
            node.text('[' + (prevCount - subCount) + ']');
        },
        /**
         * 根据分组名获取分组的节点
         * @param name 注意name是转义过的
         * @return {*}
         */
        getGroupItem:function (name) {
            var list = $('.group-list li');
            for (var i = 0, len = list.length - 1; i < len; i++) {
                var li = list.eq(i);
                if (li.find('.group-name').text() == name) {
                    return li;
                }
            }
        },
        /**
         * 使用分组名来维护联系人数量
         * @param name 注意name是转义过的
         * @param subCount
         */
        fixCountByName:function (name, subCount) {
            r.fixCount(r.getGroupItem(name).find('strong').eq(0), subCount);
        },
        /**
         * 给分组id，看某个联系人的分组中是否有该分组，有返回分组的下标
         * @param gid 组id
         * @param group 某个联系人的分组信息
         * @return {Number} 分组的下标，没找到返回-1
         */
        getGroupIndex:function (gid, group) {
            var index = -1;
            for (var i = 0, len = group.length; i < len; i++) {
                if (group[i] == gid) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        /**
         * 列表中增加组信息
         * @param id
         * @param name
         */
        addGroupInfo:function (id, gid, g) {
            var name = g.group.list[gid];
            var tr = g.node.table.find('tr[data-id="' + id + '"]');
            var infoNode = tr.find('.group>span');
            var info = infoNode.text().split(',');
            if (info[0]) {
                info.push(name);
            } else {
                info[0] = name;
            }
            infoNode.text(info.join(','));
        },
        /**
         * 列表中删除组信息或者该条数据
         * @param id
         * @param name
         */
        removeGroupInfo:function (id, gid, g) {
            var name = g.group.list[gid];
            var tr = g.node.table.find('tr[data-id="' + id + '"]');
            var infoNode = tr.find('.group>span');
            if (name == g.params.text && g.params.flag == 0) {
                tr.remove();
                if (g.node.table.find('tr[data-id]').length == 0) { // 若列表中数据被删完，重新载入该页
                    g.pagination.load();
                }
            } else {
                var info = infoNode.text().split(',');
                for (var k = 0, len3 = info.length; k < len3; k++) {
                    if (name == info[k]) {
                        info.splice(k, 1);
                        break;
                    }
                }
                infoNode.text(info.join(','));
            }
        },
        /**
         * 重建左侧，导入时会重建分组
         */
        build:function (data) {
            if (data) {
                $('#all_contact_btn').find('strong').eq(0).text('[' + data.total + ']'); // 维护总数
                var lastLi = $('.group-list li:last').clone();
                var list = data.list;
                var html = [];
                for(var i = 0, len = list.length; i < len; i++) {// 维护自定义分组
                    var g = list[i];
                    html[i] = tpl.render({
                        id:g.id,
                        name:string.code(g.name),
                        count:g.contact_count
                    });
                }
                $('.group-list ul').eq(0).html(html.join('')).append(lastLi);
                lastLi.find('strong').text('[' + data.ungroup + ']'); // 维护未分组数量
                $('.group-list li[data-flag!="1"]').each(function (i, li) { // 分组hover效果，显示/隐藏编辑删除按钮
                    $(li).hover(function (e) {
                        $(this).find('.g-opt').show();
                    }, function (e) {
                        $(this).find('.g-opt').hide();
                    });
                });
            }
        }
    };
    return r;
});