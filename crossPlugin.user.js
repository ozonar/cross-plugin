// ==UserScript==
// @name         Cross plugin
// @version      1.4
// @description:ru  Плагин добавляет кнопку закрытия карточки на популярные сайты
// @description  Add cross button to popular sites
// @author       Ozonar
// @match        https://www.ozon.ru/*
// @match        https://www.dns-shop.ru/*
// @match        https://www.wildberries.ru/*
// @match        https://vk.com/video/*
// @match        https://www.youtube.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @resource     styles https://raw.githubusercontent.com/ozonar/cross-plugin/master/crossPlugin.css
// @grant            GM_getResourceText
// @grant            GM_addStyle
// @grant            GM_xmlhttpRequest
// @downloadURL      https://raw.githubusercontent.com/ozonar/cross-plugin/master/crossPlugin.user.js
// @updateURL        https://raw.githubusercontent.com/ozonar/cross-plugin/master/crossPlugin.user.js
// @supportURL       https://github.com/ozonar/cross-plugin/issues
// @homepageURL      https://github.com/ozonar/cross-plugin
// ==/UserScript==

// Init css
const my_css = GM_getResourceText("styles");
GM_addStyle(my_css);

class CrossPlugin {
    config = {
        'elementSelector': '',
        'link': {'clearType': 'pathname'},
        'buttonConfig': {}
    };
    static config;

    constructor(config) {
        this.config = config;
        CrossPlugin.config = config;
        Storage.init('cross-plugin');
    }

    startWatch (step = 400) {
        setInterval(function() { this.run() }.bind(this), step);
    }

    run() {
        let cards = this.findCards(this.config.elementSelector);
        if (cards.length === 0) {
            return;
        }
        console.log('::', 'Start cross plugin. Find elements:', cards.length);

        this.updateDom(cards);
    }

    updateDom (cards) {
        for (let i = 0; i < cards.length; i++) {
            let card = cards[i];
            Painter.paintButton(card, this.config.buttonConfig);
            this.addListener(card, this.config.elementSelector, this.config.link.selector);

            if (this.checkElementNeedToHide(card)) {
                Painter.hideCard(card);
            }
        }
    }

    findCards(selector) {
        return document.querySelectorAll(selector + ':not(.element-with-close)');
    }

    addListener(item, selector, valueSelector) {
        item.querySelector('.close-hide-element').addEventListener('click', function (e) {
            e.preventDefault();
            Painter.hideCard(e.target.parentNode);
            let clearName = CrossPlugin.clearLinkByType(item.querySelector(valueSelector).href, CrossPlugin.config.link.clearType);
            Storage.add(clearName);
        });
    }

    static clearLinkByType(link, type) {
        let url = new URL(link, document.location.origin);

        switch (type) {
            default:
                return url.pathname;
            case "params":
                return url.pathname + url.search;
        }
    }

    checkElementNeedToHide(item) {
        let a = item.querySelector('a');
        if (a) {
            let href = CrossPlugin.clearLinkByType(a.href, CrossPlugin.config.link.clearType);            
            if (Storage.items.includes(href)) {
                return true;
            }
        }
        return false;
    }
}

class Painter {
    static paintButton(item, buttonConfig) {
        let div = document.createElement('div');

        div.style.width = '30px';
        div.style.height = '30px';
        div.style.backgroundColor = '#ff9999';
        div.style.position = buttonConfig.position ?? 'absolute';
        div.style.right = buttonConfig.right ?? 15 + 'px';
        div.style.bottom = buttonConfig.bottom + 'px';
        div.style.borderRadius = '9px';
        div.style.cursor='pointer';
        div.style.zIndex = buttonConfig.zIndex ?? 10000;

        div.classList.add('close-hide-element');
        item.appendChild(div);

        item.classList.add('element-with-close');
    }

    static hideCard(element) {
        element.style.opacity = '0.1';

        let div = document.createElement('div');

        div.style.width = '100%';
        div.style.height = '100%';
        div.style.backgroundColor = '#ffffff';
        div.style.position = 'absolute';
        div.style.opacity = '0';
        div.style.top = '0';
        div.style.zIndex = '100000';
        div.classList.add('hide-card');

        element.appendChild(div);

        div.addEventListener('click', function (e) {
            e.preventDefault();
            Painter.showCard(e.target.parentElement);
        });
    }

    static showCard (element) {
        Storage.delete(element.querySelector('a').href);
        element.style.opacity = '1';
        element.querySelector('.hide-card').remove();
    }
}

class Storage {
    static items = [];
    static name = '';

    static add(clearItem) {
        if (!Storage.isInArray(clearItem)) {
            Storage.items.push(clearItem);
            Storage.save();
        }
    }

    static delete(item) {
        let clearItem = CrossPlugin.clearLinkByType(item);

        let val = Storage.items.indexOf(clearItem);
        if (val>=0) {
            console.log(clearItem);
            Storage.items.splice(val, 1);
            Storage.save();
        }
    }

    static save() {
        localStorage.setItem(Storage.name, JSON.stringify(Storage.items));
    }

    static isInArray(href) {
        return Storage.items.includes(href);
    }

    static init(name) {
        Storage.name = name;
        let a = localStorage.getItem(Storage.name);
        if (a) {
            Storage.items = JSON.parse(a);
        } else {
            Storage.items = [];
        }
    }
}

class HostConfig {
    static hostList = {
        'www.ozon.ru': {
            'elementSelector': '.widget-search-result-container > div > div',
            'buttonConfig': {
                'bottom' : 71,
            },
            'link': {'selector': 'a'}
        },
        'www.dns-shop.ru': {
            'elementSelector': '.catalog-product',
            'link': {'selector': 'a'},
            'buttonConfig': {
                'bottom' : 15,
                'zIndex': 9,
            }
        },
        'www.wildberries.ru': {
            'elementSelector': '.product-card-list .product-card',
            'link': {'selector': 'a'},
            'buttonConfig': {
                'bottom' : 0,
                'zIndex': 300,
            }
        },
        'vk.com': {
            'elementSelector': '.VideoCard',
            'link': {'selector': 'a'},
            'buttonConfig': {
                'bottom' : 15,
                'zIndex': 300,
            }
        },
        'www.youtube.com': {
            'elementSelector': 'ytd-rich-item-renderer',
            'linkSelector': 'a',
            'buttonConfig': {
                'bottom' : 27,
                'right' : 0,
                'zIndex': 300,
            },
            'link': {
                'selector': 'a',
                'clearType': 'params'
            }
        },
    };

    static getCurrent() {
        return this.get(document.location.host);
    }

    static get(host) {
        return this.hostList[host];
    }
}

let crossPlugin = new CrossPlugin(HostConfig.getCurrent());
crossPlugin.startWatch();
