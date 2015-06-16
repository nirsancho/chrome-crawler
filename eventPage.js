function log(o) {
    console.log(o);
}
var work_state = {};
var worker_responses = {};
function get_response(tab_id, msg) {
    var worker = work_state[tab_id];
    if (!work_state.hasOwnProperty(tab_id)) {
        worker_responses[tab_id] = [];
        worker_responses[tab_id].push(msg);
        work_state[tab_id] = {
            state: 1,
            action: 'get_element_count',
            selector: '.prL3 > a',
            idx: [0, 0, 0],
            counts:[-1, -1, -1]
        };
    } else {
        if (worker.state == 1) {
            worker.action = 'click';
            worker.click_idx = worker.idx[0];
        } else if (worker.state == 2) {
            worker.selector = '.levelP2 a';
            worker.action = 'get_element_count';
        } else if (worker.state == 3) {

        } else {
            work_state[tab_id] = undefined;
        }
        worker.push(msg);
        worker.state++;
    }

    return work_state[tab_id]
}

function on_new_msg_factory(port) {
    return (function (msg) {
        log(port.sender.tab.id);
        log(msg);
        var res = get_response(port.sender.tab.id, msg);
        if (res) {
            port.postMessage(res);
        }
    });
}

var eventPage = new(function () {
    chrome.runtime.onConnect.addListener(function (port) {
        console.assert(port.name == "crawler");
        log(port);
        port.onMessage.addListener(on_new_msg_factory(port));
    });
})();
