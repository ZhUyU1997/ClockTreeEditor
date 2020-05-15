'use strict'
// console.log=function(msg){
//     $("#debug").text($("#debug").text()+"\n"+msg)
// };
function updateLink() {
    // const canvas = document.querySelector('#canvas');
    // const ctx = canvas.getContext('2d');
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("update");
    $(".svg_bg").empty();
    $(".circle-right").each(
        function () {
            let circle = $(this);
            if ($(this).is(':hidden'))
                return;
            let X1 = circle.offset().left + 5;
            let Y1 = circle.offset().top + 5;

            let circle_left = $(this).parent().next().children(".container").children(".container-left").children(".circle-left").each(
                function () {
                    let X2 = $(this).offset().left + 5;
                    let Y2 = $(this).offset().top + 5;

                    let offsetX = $(".root").offset().left;
                    let offsetY = $(".root").offset().top;
                    drawBezier([X1 - offsetX, Y1 - offsetY], [X1 + 20 - offsetX, Y1 - offsetY], [X2 - 20 - offsetX, Y2 - offsetY], [X2 - offsetX, Y2 - offsetY]);
                }
            );
        }
    );
}

function update() {
    updateLink();
}

function drawBezier(beginPoint, controlPoint1, controlPoint2, endPoint) {
    let path = $(document.createElementNS("http://www.w3.org/2000/svg", "path"));
    path.attr("d", `M ${Math.trunc(beginPoint[0])} ${Math.trunc(beginPoint[1])} 
        C ${Math.trunc(controlPoint1[0])} ${Math.trunc(controlPoint1[1])}, 
        ${Math.trunc(controlPoint2[0])} ${Math.trunc(controlPoint2[1])}, 
        ${Math.trunc(endPoint[0])} ${Math.trunc(endPoint[1])}`);
    path.attr({
        "d": `M ${Math.trunc(beginPoint[0])} ${Math.trunc(beginPoint[1])} 
            C ${Math.trunc(controlPoint1[0])} ${Math.trunc(controlPoint1[1])}, 
            ${Math.trunc(controlPoint2[0])} ${Math.trunc(controlPoint2[1])}, 
            ${Math.trunc(endPoint[0])} ${Math.trunc(endPoint[1])}`,
        "stroke": "#ff8876",
        "stroke-width": "3",
        "fill": "none",
        // "name":"342"
    });

    $(".svg_bg").append(path);
}

function parseDeviceTree(json) {
    let deviceTree = {
        "root": {
            name: "root",
            child: []
        }
    };
    let nameMap = { "root": "root" };

    for (let i in json) {
        if (i.substr(0, 4) !== "clk-") {
            continue;
        }

        deviceTree[i] = {};
        for (let j in json[i]) {
            deviceTree[i][j] = json[i][j];
            if (j === "name") {
                nameMap[json[i][j]] = i;
            }
        }

        if (!("parent" in deviceTree[i])) {
            deviceTree[i]["parent"] = "root";
        }
        deviceTree[i]["child"] = [];
    }

    for (let i in deviceTree) {
        if (deviceTree[i].name === "root")
            continue;

        let parent = null;

        if (typeof (deviceTree[i]["parent"]) == "string") {
            parent = deviceTree[i]["parent"];
        }
        else {
            parent = deviceTree[i]["parent"][0]["name"];
        }

        let nodeName = nameMap[parent];

        if(typeof(nodeName) !== "undefined")
            deviceTree[nodeName].child.push(i);
    }

    return deviceTree;
}

function main() {

    $(window).resize(update);


    Vue.component('Container', {
        props: ["nodeName", "deviceTree"],
        template: `
        <div class="container">
            <div class="container-left">
                <span>
                    <input type="text" v-model="nodeName"/>
                </span>
                <Editor v-for="(item,index) of deviceTree[nodeName]" :key="index" :dataKey="index" :dataValue="item"/>
    
                <div class="circle circle-right" ref="circleRight"></div>
                <div class="circle circle-left" ref="circleLeft"></div>
            </div>
            <div class="container-right">
                <container v-for="(item,index) of deviceTree[nodeName].child" :key="index" :nodeName="item" :deviceTree="deviceTree"/>
            </div>
        </div>`,
        updated: function () {
            updateLink();
        }
    })

    Vue.component('Editor', {
        props: ["dataKey", "dataValue","fold"],
        template: `
        <template v-if="dataKey !== 'child'">
            <span v-if="typeof(dataValue) === 'number'">
                <input class="balloon" type="text"  oninput="value=value.replace(/[^\\d]/g,'')" v-model="dataValue"/>
                <label>{{ dataKey }}</label>
            </span>
            <span v-else-if="typeof(dataValue) === 'boolean'">
                <label class="balloon checkbox"><input type='checkbox'  v-model="dataValue"></label>
                <label>{{ dataKey }}</label>
            </span>
            <span v-else-if="typeof(dataValue) === 'object'" class="object">
                <span>
                    <label class="balloon drop-down checkbox"><input type='checkbox' v-model="fold"/></label>
                    <label>{{ dataKey }}</label>
                </span>
                <Editor v-for="(item,index) of dataValue" :key="index" :dataKey="index" :dataValue="item" v-if="!fold"/>
            </span>
            <span v-else="typeof(dataValue) === 'string'">
                <input class="balloon" type="text" v-model="dataValue"/>
                <label>{{ dataKey }}</label>
            </span>
        </template>`,
        updated: function () {
            updateLink();
        }
    })

    let deviceTree = parseDeviceTree({
        "clk-fixed@0": { "name": "osc24m", "rate": 24000000 },
        "clk-fixed@1": { "name": "osc32k", "rate": 32768 },
        "clk-fixed@2": { "name": "iosc", "rate": 16000000 },

        "clk-s3-pll@0": { "parent": "osc24m", "name": "pll-cpu", "channel": 0 },
        "clk-s3-pll@1": { "parent": "osc24m", "name": "pll-audio", "channel": 1 },
        "clk-s3-pll@2": { "parent": "osc24m", "name": "pll-video", "channel": 2 },
        "clk-s3-pll@3": { "parent": "osc24m", "name": "pll-ve", "channel": 3 },
        "clk-s3-pll@4": { "parent": "osc24m", "name": "pll-ddr0", "channel": 4 },
        "clk-s3-pll@5": { "parent": "osc24m", "name": "pll-periph0", "channel": 5 },
        "clk-s3-pll@6": { "parent": "osc24m", "name": "pll-isp", "channel": 6 },
        "clk-s3-pll@7": { "parent": "osc24m", "name": "pll-periph1", "channel": 7 },
        "clk-s3-pll@8": { "parent": "osc24m", "name": "pll-ddr1", "channel": 8 },

        "clk-fixed-factor@0": { "parent": "osc24m", "name": "osc24m-750", "mult": 1, "div": 750 },
        "clk-fixed-factor@1": { "parent": "pll-periph0", "name": "pll-periph0-2", "mult": 1, "div": 2 },
        "clk-fixed-factor@2": { "parent": "iosc", "name": "losc", "mult": 1, "div": 512 },

        "clk-mux@0x01c20050": {
            "parent": [
                { "name": "losc", "value": 0 },
                { "name": "osc24m", "value": 1 },
                { "name": "pll-cpu", "value": 2 }
            ],
            "name": "cpu", "shift": 16, "width": 2
        },
        "clk-divider@0x01c20050": { "parent": "cpu", "name": "axi", "shift": 0, "width": 2, "divider-one-based": true },
        "clk-divider@0x01c20054": { "parent": "pll-periph0", "name": "ahb1-pre-div", "shift": 6, "width": 2, "divider-one-based": true },
        "clk-mux@0x01c20054": {
            "parent": [
                { "name": "losc", "value": 0 },
                { "name": "osc24m", "value": 1 },
                { "name": "axi", "value": 2 },
                { "name": "ahb1-pre-div", "value": 3 }
            ],
            "name": "mux-ahb1", "shift": 12, "width": 2
        },
        "clk-ratio@0x01c20054": { "parent": "mux-ahb1", "name": "ahb1", "shift": 4, "width": 2 },
        "clk-ratio@0x01c20054": { "parent": "ahb1", "name": "apb1", "shift": 8, "width": 2 },
        "clk-mux@0x01c20058": {
            "parent": [
                { "name": "losc", "value": 0 },
                { "name": "osc24m", "value": 1 },
                { "name": "pll-periph0", "value": 2 }
            ],
            "name": "mux-apb2", "shift": 24, "width": 2
        },
        "clk-ratio@0x01c20058": { "parent": "mux-apb2", "name": "ratio-apb2", "shift": 16, "width": 2 },
        "clk-divider@0x01c20058": { "parent": "ratio-apb2", "name": "apb2", "shift": 0, "width": 4, "divider-one-based": true },
        "clk-mux@0x01c2005c": {
            "parent": [
                { "name": "ahb1", "value": 0 },
                { "name": "pll-periph0-2", "value": 1 }
            ],
            "name": "ahb2", "shift": 0, "width": 2
        },

        "clk-gate@0x01c2006c": { "parent": "apb2", "name": "gate-bus-uart0", "shift": 16, "invert": false },
        "clk-gate@0x01c2006c": { "parent": "apb2", "name": "gate-bus-uart1", "shift": 17, "invert": false },
        "clk-gate@0x01c2006c": { "parent": "apb2", "name": "gate-bus-uart2", "shift": 18, "invert": false },
        "clk-link": { "parent": "gate-bus-uart0", "name": "link-uart0" },
        "clk-link": { "parent": "gate-bus-uart1", "name": "link-uart1" },
        "clk-link": { "parent": "gate-bus-uart2", "name": "link-uart2" },

        "clk-gate@0x01c2006c": { "parent": "apb2", "name": "gate-bus-i2c0", "shift": 0, "invert": false },
        "clk-gate@0x01c2006c": { "parent": "apb2", "name": "gate-bus-i2c1", "shift": 1, "invert": false },
        "clk-link": { "parent": "gate-bus-i2c0", "name": "link-i2c0" },
        "clk-link": { "parent": "gate-bus-i2c1", "name": "link-i2c1" },

        "clk-gate@0x01c200cc": { "parent": "ahb1", "name": "gate-bus-usbphy0", "shift": 8, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-bus-usbphy0", "name": "gate-bus-usb-otg-device", "shift": 24, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-bus-usbphy0", "name": "gate-bus-usb-otg-ehci0", "shift": 26, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-bus-usbphy0", "name": "gate-bus-usb-otg-ohci0", "shift": 29, "invert": false },
        "clk-gate@0x01c200cc": { "parent": "gate-bus-usb-otg-ohci0", "name": "gate-usb-otg-ohci0", "shift": 16, "invert": false },
        "clk-link": { "parent": "gate-bus-usb-otg-device", "name": "link-usb-otg-device" },
        "clk-link": { "parent": "gate-bus-usb-otg-ehci0", "name": "link-usb-otg-ehci0" },
        "clk-link": { "parent": "gate-usb-otg-ohci0", "name": "link-usb-otg-ohci0" },

        "clk-gate@0x01c20060": { "parent": "ahb1", "name": "gate-bus-hstimer", "shift": 19, "invert": false },
        "clk-link": { "parent": "gate-bus-hstimer", "name": "link-hstimer" },

        "clk-gate@0x01c20070": { "parent": "ahb2", "name": "gate-bus-ephy", "shift": 0, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-bus-ephy", "name": "gate-bus-emac", "shift": 17, "invert": false },
        "clk-link": { "parent": "gate-bus-emac", "name": "link-emac" },

        "clk-mux@0x01c200a0": {
            "parent": [
                { "name": "osc24m", "value": 0 },
                { "name": "pll-periph0", "value": 1 },
                { "name": "pll-periph1", "value": 2 }
            ],
            "name": "mux-spi0", "shift": 24, "width": 2,
            "default": { "parent": "pll-periph0" }
        },
        "clk-ratio@0x01c200a0": { "parent": "mux-spi0", "name": "ratio-spi0", "shift": 16, "width": 2 },
        "clk-divider@0x01c200a0": { "parent": "ratio-spi0", "name": "div-spi0", "shift": 0, "width": 4, "divider-one-based": true, "default": { "rate": 100000000 } },
        "clk-gate@0x01c200a0": { "parent": "div-spi0", "name": "gate-spi0", "shift": 31, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-spi0", "name": "gate-bus-spi0", "shift": 20, "invert": false },
        "clk-link": { "parent": "gate-bus-spi0", "name": "link-spi0" },

        "clk-mux@0x01c20c10": {
            "parent": [
                { "name": "losc", "value": 0 },
                { "name": "osc24m", "value": 1 }
            ],
            "name": "mux-timer0", "shift": 2, "width": 2
        },
        "clk-ratio@0x01c20c10": { "parent": "mux-timer0", "name": "ratio-timer0", "shift": 4, "width": 3 },
        "clk-link": { "parent": "ratio-timer0", "name": "link-timer0" },

        "clk-mux@0x01c20c20": {
            "parent": [
                { "name": "losc", "value": 0 },
                { "name": "osc24m", "value": 1 }
            ],
            "name": "mux-timer1", "shift": 2, "width": 2
        },
        "clk-ratio@0x01c20c20": { "parent": "mux-timer1", "name": "ratio-timer1", "shift": 4, "width": 3 },
        "clk-link": { "parent": "ratio-timer1", "name": "link-timer1" },

        "clk-mux@0x01c20c30": {
            "parent": [
                { "name": "losc", "value": 0 },
                { "name": "osc24m", "value": 1 }
            ],
            "name": "mux-timer2", "shift": 2, "width": 2
        },
        "clk-ratio@0x01c20c30": { "parent": "mux-timer2", "name": "ratio-timer2", "shift": 4, "width": 3 },
        "clk-link": { "parent": "ratio-timer2", "name": "link-timer2" },

        "clk-link": { "parent": "osc24m", "name": "link-pwm" },
        "clk-link": { "parent": "osc24m-750", "name": "link-wdt" },

        "clk-mux@0x01c20104": {
            "parent": [
                { "name": "pll-video", "value": 0 },
                { "name": "pll-periph0", "value": 1 }
            ],
            "name": "mux-de", "shift": 24, "width": 3,
            "default": { "parent": "pll-video" }
        },
        "clk-divider@0x01c20104": { "parent": "mux-de", "name": "div-de", "shift": 0, "width": 4, "divider-one-based": true, "default": { "rate": 396000000 } },
        "clk-gate@0x01c20104": { "parent": "div-de", "name": "gate-de", "shift": 31, "invert": false },
        "clk-gate@0x01c20064": { "parent": "gate-de", "name": "gate-bus-de", "shift": 12, "invert": false },
        "clk-link": { "parent": "gate-bus-de", "name": "link-de" },

        "clk-mux@0x01c20118": {
            "parent": [
                { "name": "pll-video", "value": 0 },
                { "name": "pll-periph0", "value": 1 }
            ],
            "name": "mux-tcon", "shift": 24, "width": 3,
            "default": { "parent": "pll-video" }
        },
        "clk-divider@0x01c20118": { "parent": "mux-tcon", "name": "div-tcon", "shift": 0, "width": 4, "divider-one-based": true, "default": { "rate": 396000000 } },
        "clk-gate@0x01c20118": { "parent": "div-tcon", "name": "gate-tcon", "shift": 31, "invert": false },
        "clk-gate@0x01c20064": { "parent": "gate-tcon", "name": "gate-bus-tcon", "shift": 4, "invert": false },
        "clk-link": { "parent": "gate-bus-tcon", "name": "link-tcon" },

        "clk-mux@0x01c20088": {
            "parent": [
                { "name": "osc24m", "value": 0 },
                { "name": "pll-periph0", "value": 1 },
                { "name": "pll-periph1", "value": 2 }
            ],
            "name": "mux-sdmmc0", "shift": 24, "width": 2,
            "default": { "parent": "pll-periph0" }
        },
        "clk-ratio@0x01c20088": { "parent": "mux-sdmmc0", "name": "ratio-sdmmc0", "shift": 16, "width": 2 },
        "clk-divider@0x01c20088": { "parent": "ratio-sdmmc0", "name": "div-sdmmc0", "shift": 0, "width": 4, "divider-one-based": true, "default": { "rate": 50000000 } },
        "clk-gate@0x01c20088": { "parent": "div-sdmmc0", "name": "gate-sdmmc0", "shift": 31, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-sdmmc0", "name": "gate-bus-sdmmc0", "shift": 8, "invert": false },
        "clk-link": { "parent": "gate-bus-sdmmc0", "name": "link-sdmmc0" },

        "clk-mux@0x01c2008c": {
            "parent": [
                { "name": "osc24m", "value": 0 },
                { "name": "pll-periph0", "value": 1 },
                { "name": "pll-periph1", "value": 2 }
            ],
            "name": "mux-sdmmc1", "shift": 24, "width": 2,
            "default": { "parent": "pll-periph0" }
        },
        "clk-ratio@0x01c2008c": { "parent": "mux-sdmmc1", "name": "ratio-sdmmc1", "shift": 16, "width": 2 },
        "clk-divider@0x01c2008c": { "parent": "ratio-sdmmc1", "name": "div-sdmmc1", "shift": 0, "width": 4, "divider-one-based": true, "default": { "rate": 50000000 } },
        "clk-gate@0x01c2008c": { "parent": "div-sdmmc1", "name": "gate-sdmmc1", "shift": 31, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-sdmmc1", "name": "gate-bus-sdmmc1", "shift": 9, "invert": false },
        "clk-link": { "parent": "gate-bus-sdmmc1", "name": "link-sdmmc1" },

        "clk-mux@0x01c20090": {
            "parent": [
                { "name": "osc24m", "value": 0 },
                { "name": "pll-periph0", "value": 1 },
                { "name": "pll-periph1", "value": 2 }
            ],
            "name": "mux-sdmmc2", "shift": 24, "width": 2,
            "default": { "parent": "pll-periph0" }
        },
        "clk-ratio@0x01c20090": { "parent": "mux-sdmmc2", "name": "ratio-sdmmc2", "shift": 16, "width": 2 },
        "clk-divider@0x01c20090": { "parent": "ratio-sdmmc2", "name": "div-sdmmc2", "shift": 0, "width": 4, "divider-one-based": true, "default": { "rate": 50000000 } },
        "clk-gate@0x01c20090": { "parent": "div-sdmmc2", "name": "gate-sdmmc2", "shift": 31, "invert": false },
        "clk-gate@0x01c20060": { "parent": "gate-sdmmc2", "name": "gate-bus-sdmmc2", "shift": 10, "invert": false },
        "clk-link": { "parent": "gate-bus-sdmmc2", "name": "link-sdmmc2" }
    })

    let vue = new Vue({
        el: "#root",
        data: {
            root: deviceTree
        },
        updated: function () {
            updateLink();
        }
    })

    updateLink();
}

main();