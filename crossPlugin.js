// ==UserScript==
// @name         Cross plugin
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to close the world!
// @author       Anarhistov
// @match        https://www.ozon.ru/*
// @match        https://www.dns-shop.ru/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

class CrossPlugin {
    config;

    constructor(config) {
        this.config = config;
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
        this.paintButtons(cards, config.buttonConfig);
        this.checkRemoveCards(cards);
        this.addListeners(cards, config.elementSelector, config.linkSelector);
    }

    findCards(selector) {
        return document.querySelectorAll(selector + ':not(.element-with-close)');
    }

    paintButtons(items, buttonConfig) {
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            Painter.paintButton(item, buttonConfig);
        }
    }

    addListeners(items, selector, valueSelector) {
        for (let i = 0; i < items.length; i++) {
            let item = items[i];

            item.querySelector('.close-hide-element').addEventListener('click', function (e) {
                e.preventDefault();
                Painter.hideCard(e.target.parentNode);
                Storage.add(item.querySelector(valueSelector).href)
            });
        }
    }

    checkRemoveCards(items) {
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (this.checkElementNeedRemove(item)) {
                Painter.hideCard(item);
            }
        }
    }

    checkElementNeedRemove(item) {
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

    static hideCard(el) {
        el.style.opacity = '0.1';

        let div = document.createElement('div');

        div.style.width = '100%';
        div.style.height = '100%';
        div.style.backgroundColor = '#ffffff';
        div.style.position = 'absolute';
        div.style.opacity = '0';
        div.style.zIndex = '100000';
        div.classList.add('hide-card');

        el.appendChild(div);

        div.addEventListener('click', function (e) {
            e.preventDefault();

            Storage.delete(e.target.parentElement.querySelector('a').href);
            e.target.parentElement.style.opacity = '1';
            e.target.remove();

        });
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
    static list = {
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

    static get(host) {
        return this.list[host];
    }
}

let config = HostConfig.get(document.location.host);
Storage.init();


let crossPlugin = new CrossPlugin(config);
crossPlugin.startWatch();




















