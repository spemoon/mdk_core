/**
 * 联系人列表界面的绘制
 */
define(function (require, exports, module) {
    var $ = require('jquery');
    var lang = require('../core/lang');
    var string = require('../core/string');
    var tpl = {
        group:require('./../../../app/contact/tpl/group_item'),
        item:require('./../../../app/contact/tpl/list_item')
    };

    var config = {
        avatar:'http://momo.im/style/images/noavatar_48.jpg'
    };


    var listView = {
        /**
         * 构建联系人列表视图
         * @param data 当前页的数据
         */
        list:function (data) {
            if (lang.isArray(data)) {
                var html = [];
                var fc;
                var listNode = $('#contact_list');
                var len = data.length;
                if (len) {
                    for (var i = 0; i < len; i++) {
                        var item = data[i];
                        var flag = '';
                        var ifc = item.sort.charAt(0).toUpperCase();
                        if (fc !== ifc) {
                            fc = ifc;
                            flag = fc;
                        }
                        html[i] = tpl.item.render({
                            fc:flag,
                            id:item.id,
                            name:item.formatted_name,
                            phone:(item.tels && item.tels[0] && item.tels[0].value) || '',
                            city:(item.tels && item.tels[0] && item.tels[0].city) || '',
                            group:string.code(item.category) || '',
                            avatar:item.avatar || config.avatar,
                            email:(item.emails && item.emails[0] && item.emails[0].value) || ''
                        });
                    }
                    listNode.html(html.join(''));
                    listNode.parent()[0].scrollTop = 0;
                } else {
                    listNode.html('<tr><td>没有联系人数据</td></tr>');
                }
                listView.height();
            }
        },
        navigation:function (data) {
            $('.alphabet td a').each(function (i, a) {
                if (i > 0) {
                    var node = $(a);
                    var c = node.text().toLowerCase();
                    if ($.inArray(c, data) == -1) {
                        node.removeClass('enable');
                    } else {
                        node.addClass('enable');
                    }
                }
            });
        },
        height:function () {
            var h = $('.top-bar').outerHeight() + $('.ct-rt-top').outerHeight() + $('.search-bar').outerHeight() + $('.alphabet').outerHeight() + $('.contact-table-title').outerHeight() + $('.contact-table-pagination').outerHeight()
            $('.contact-table-body').eq(0).height($(window).height() - h).css('overflow-y', 'auto');
        }
    };

    return listView;
});