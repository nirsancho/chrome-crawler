function log(o) {
  console.log(o);
}

function click_element(element) {
  element.dispatchEvent(new MouseEvent("click"));
}

function post_objects(port, objects) {
  port.postMessage({
    objects: objects
  });
}

function post_done(port) {
  port.postMessage({
    status: 'done',
    filename: window.location.hostname + '.csv'
  });
}

function navigate(port, url) {
  port.postMessage({
    navigate: url
  });
}

$(function() {

  var parser = parsers[window.location.hostname]
  if (parser) {

    port = chrome.runtime.connect({
      name: "crawler"
    });


    parser(port);

    port.onMessage.addListener(function(msg) {
      log(msg);

      // if (msg.action) {
      //   var res = eval(msg.action + '(msg)');
      //   if (res) {
      //     port.postMessage(res);
      //   }
      // }
      //
      // if (msg.id) {
      //   msg.response = eval(msg.code);
      //   log(msg);
      //   port.postMessage(msg)
      // }
    });
  }

});
