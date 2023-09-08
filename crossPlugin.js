// ==UserScript==
// @name         Cross plugin
// @version      1.0
// @description:ru  Плагин добавляет кнопку закрытия карточки на популярные сайты
// @description  Add cross button to popular sites
// @author       Ozonar
// @match        https://www.ozon.ru/*
// @match        https://www.dns-shop.ru/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @downloadURL      https://raw.githubusercontent.com/ozonar/cross-plugin/master/crossPlugin.js
// @updateURL        https://raw.githubusercontent.com/ozonar/cross-plugin/master/crossPlugin.js
// @supportURL       https://github.com/ozonar/cross-plugin/issues
// @homepageURL      https://github.com/ozonar/cross-plugin
// ==/UserScript==

class CrossPlugin {
    config = {
        'elementSelector': '',
        'linkSelector': '',
        'buttonConfig': {}
    };

    constructor(config) {
        this.config = config;
        Storage.init();
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

        this.updateDom(cards)
    }

    updateDom (cards) {
        for (let i = 0; i < cards.length; i++) {
            let card = cards[i];
            Painter.paintButton(card, this.config.buttonConfig);
            this.addListener(card, this.config.elementSelector, this.config.linkSelector);

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
            Storage.add(item.querySelector(valueSelector).href)
        });
    }

    checkElementNeedToHide(item) {
        let a = item.querySelector('a');
        if (a) {
            let href = Storage.clear(a.href);
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
        div.style.position = 'absolute';
        div.style.right = buttonConfig.right ?? 15 + 'px';
        div.style.bottom = buttonConfig.bottom + 'px';
        div.style.borderRadius = '9px';
        div.style.cursor='pointer';

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

    static add(item) {
        let clearItem = Storage.clear(item);

        if (!Storage.isInArray(clearItem)) {
            Storage.items.push(clearItem);
            Storage.save();
        }
    }

    static delete(item) {
        let clearItem = Storage.clear(item);

        let val = Storage.items.indexOf(clearItem);
        if (val) {
            Storage.items.splice(val, 1);
            Storage.save();
        }
    }

    static save() {
        localStorage.setItem('cross-plugin', JSON.stringify(Storage.items));
    }

    static isInArray(href) {
        return Storage.items.includes(href);
    }

    static clear(item) {
        let url = new URL(item);
        return url.pathname;
    }

    static init() {
        let a = localStorage.getItem('cross-plugin');
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
            'linkSelector': 'a',
            'buttonConfig': {
                'bottom' : 71,
            }
        },
        'www.dns-shop.ru': {
            'elementSelector': '.catalog-product',
            'linkSelector': 'a',
            'buttonConfig': {
                'bottom' : 15,
            }
        }
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
