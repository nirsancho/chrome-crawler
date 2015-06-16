function log(o) {
    console.log(o);
}

function get_element_count(msg) {
    return $(msg.selector).length;
}

function click(msg) {
    var elements = $(msg.selector)
    log(elements)
    log(elements[msg.click_idx])
    elements[msg.click_idx].dispatchEvent(new MouseEvent("click"));
}

$(function () {

    var port = chrome.runtime.connect({
        name: "crawler"
    });
    port.postMessage({
        body: "crawler-alive",
        url: location
    });
    port.onMessage.addListener(function (msg) {
        log(msg);
        if (msg.action) {
            var res = eval(msg.action+'(msg)');
            if (res) {
                port.postMessage(res);
            }
        }
    });
});
