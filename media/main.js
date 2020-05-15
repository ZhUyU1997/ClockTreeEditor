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

            if($(this).parent().next().css("display") === "none")
                return;
            let circle_left = $(this).parent().next().children(".container").children(".container-left").children(".circle-left").each(
                function () {
                    console.log($(this).css("display"))
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

        if (typeof (nodeName) !== "undefined")
            deviceTree[nodeName].child.push(i);
    }

    return deviceTree;
}

function main() {

    $(window).resize(update);


    Vue.component('Container', {
        props: ["nodeName", "deviceTree"],
        data: function () {
            return {
                "rightFold": false,
                "leftFold": false
            }
        },
        template: `
        <div class="container">
            <div class="container-left">
                <span>
                    <input type="text" v-model="nodeName"/>
                </span>
                <Editor v-for="(item,index) of deviceTree[nodeName]" v-show="!leftFold" :key="index" :dataKey="index" :dataValue="item"/>
                <div class="circle circle-right" ref="circleRight" v-on:click="clickRight"></div>
                <div class="circle circle-left" ref="circleLeft" v-on:click="clickLeft"></div>
            </div>
            <div class="container-right" v-show="!rightFold">
                <container v-for="(item,index) of deviceTree[nodeName].child" :key="index" :nodeName="item" :deviceTree="deviceTree"/>
            </div>
        </div>`,
        methods: {
            clickRight() {
                this.rightFold = !this.rightFold;
            },
            clickLeft() {
                this.leftFold = !this.leftFold;
            }
        },
        updated: function () {
            updateLink();
        }
    })

    Vue.component('Editor', {
        props: ["dataKey", "dataValue", "fold"],
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
                <Editor v-for="(item,index) of dataValue" :key="index" :dataKey="index" :dataValue="item" v-show="!fold"/>
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

    let deviceTree = parseDeviceTree({})

    let vue = new Vue({
        el: "#root",
        data: {
            root: deviceTree
        },
        updated: function () {
            updateLink();
        }
    })

    const vscode = acquireVsCodeApi();

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'update':
                const text = message.text;

                // Update our webview's content
                
                let ret = parseDeviceTree(JSON.parse(text))
                console.log(ret)
                vue.root = ret;
                // Then persist state information.
                // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
                vscode.setState({ text });

                return;
        }
    });

    // Webviews are normally torn down when not visible and re-created when they become visible again.
    // State lets us save information across these re-loads
    const state = vscode.getState();
    if (state) {
        updateContent(state.text);
    }

    updateLink();
}

main();