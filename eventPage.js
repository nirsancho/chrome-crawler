function log(o) {
  console.log(o);
}

function assert() {
  console.assert(arguments)
}

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

Array.range = function(a, b, step) {
  var A = [];
  if (typeof a == 'number') {
    A[0] = a;
    step = step || 1;
    while (a + step <= b) {
      A[A.length] = a += step;
    }
  } else {
    var s = 'abcdefghijklmnopqrstuvwxyz';
    if (a === a.toUpperCase()) {
      b = b.toUpperCase();
      s = s.toUpperCase();
    }
    s = s.substring(s.indexOf(a), s.indexOf(b) + 1);
    A = s.split('');
  }
  return A;
}


function ConvertToCSV(objArray) {
  var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  var str = '';

  for (var i = 0; i < array.length; i++) {
    var line = '';
    for (var index in array[i]) {
      if (line != '') line += ','

      line += array[i][index];
    }

    str += line + '\r\n';
  }

  return str;
}


function get_level_elemet_count(port, level, cb) {
  var selector = [
    ".prLevel1.prTxtLelel1",
    ".levelP2Over, .levelP2",
    ".prL3"
  ];
  assert(level < selector.length);
  rpc(port, '$("{0}").length'.format(selector[level]), cb);
}

// function(msg){
//   log('level {0}: {1}'.format(level, msg.response))
//   if (level < 2) {
//     return get_level_elemet_count(port, level+1)
//   }
// }
function done(err) {
  if (err) {
    console.error(err);
  }
  log('Done!')
}

function iterate_though_level_0(port) {
  get_level_elemet_count(port, 0, function(msg) {
    var elements = Array.range(0, msg.response - 1);
    async.eachSeries(elements, function(element) {
      rpc(port, 'click_element("{0}",{1})'.format(".prLevel1.prTxtLelel1", element))
    }, done)


  })
}

function iterate_though_level_1(port, element) {

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
      counts: [-1, -1, -1]
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


var g_callbacks = {
  next_id: 1,
  callbacks: {}
}


function install_callback(cb) {
  if (cb !== undefined) {
    g_callbacks.next_id++
      g_callbacks.callbacks[g_callbacks.next_id] = cb
    return g_callbacks.next_id
  } else {
    return -1;
  }
}

function fire_callback(id, args) {
  if (id != -1) {
    console.assert(g_callbacks.callbacks[id] !== undefined)
    var cb_res = g_callbacks.callbacks[id](args);
    delete g_callbacks.callbacks[id];
    return cb_res
  }
}

function rpc(port, code, callback) {
  var cb_id = install_callback(callback);
  port.postMessage({
    id: cb_id,
    code: code
  })
}


var objects = []

function on_new_msg(msg) {
  if (msg.id !== undefined) {
    return fire_callback(msg.id, msg)
  }
  if (msg.objects) {
    $.merge(objects, msg.objects);
    log('objects count: ' + objects.length)
  } else if (msg.status) {
    if (msg.status == 'done') {
      var filename = msg.filename || 'general_site.csv';
      saveAs(new Blob([ConvertToCSV(objects)], {type: "text/plain;charset=utf-8"}), filename);
    }
  }
}

function on_new_msg_factory(port) {
  return function(msg) {
    // assumes port is in colosure
    // log(port.sender.tab.id);
    // log(msg);
    var res = on_new_msg(msg);
    if (res) {
      port.postMessage(res);
    }
  };
}

var eventPage = new(function() {
  chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "crawler");
    // log(port);
    port.onMessage.addListener(on_new_msg_factory(port));

    // iterate_though_level_0(port);
  });
})();
