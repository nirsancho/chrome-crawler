var parsers = {}
parsers['www.rami-levy.co.il'] = function(port) {

  function get_all_page_products() {
    var products = [];
    $('.productflow').each(function(index, element) {
      try {
        var product = {};
        product.site_id = $('a', element).first().attr('name');
        product.image_small = $('[id^="prod-pic"]', element).attr('src');
        product.name = $('.prodName', element).text();
        product.brand = $('.prodBrand', element).text().split(':')[1].trim();
        product.price = parseFloat($('.prodPrice', element).text());
        products.push(product);
      } catch (e) {
        log(e)
      }
    });

    return products;
  }

  var products = get_all_page_products();
  if (products.length > 0) {
    post_objects(port, products);
  }

  if ($('table.firstLastDiv a').length > 0) {
    click_element($('table.firstLastDiv a')[0]);
  } else if ($('.levelP2Over').parent().next().length > 0) {
    click_element($('.levelP2Over').parent().next()[0]);
  } else if ($('.prLevel1.prTxtLelel1Over').next().next().length > 0) {
    click_element($('.prLevel1.prTxtLelel1Over').next().next()[0]);
  } else if (window.location.search == "?catid=%7B1EED39DF-12D0-4465-AAAA-147DC194CE99%7D") {
    post_done(port);
  }

};

parsers['www.mega.co.il'] = function(port) {
  function get_all_page_products() {
    var products = [];
    $('.dvProduct').each(function(index, element) {
      try {
        var product = {};
        var image = $('[id^="imgProduct"]', element)[0]
        product.site_id = parseInt(image.id.split('_')[1])
        product.image_small = image.src;
        product.name = $('#divProduct_' + product.site_id + '_description').text().trim();
        product.price = parseFloat($('#divProduct_' + product.site_id + '_linePrice2').text().trim())
        product.brand = $('#divProduct_' + product.site_id + '_linePrice1').children().first().text().trim()
        products.push(product);
      } catch (e) {
        log(e)
      }
    });

    return products;
  }

  var products = get_all_page_products();
  if (products.length > 0) {
    post_objects(port, products);
  }

  if ($('.next_page > a').first().length > 0) {

    click_element($('.next_page > a').first()[0]);

  } else {

    var all_categories = $('[id^="Item_lvl3"]').map(function() {
      return this.id
    }).get();

    var visited_categories = storage.get('visited', {});
    var next_category = undefined;
    all_categories.forEach(function(category, index) {
      if (!visited_categories.hasOwnProperty(category)) {
        next_category = category;
        return false
      }
    });

    if (next_category) {
      visited_categories[next_category] = true;
      storage.set('visited', visited_categories);
      click_element($('#' + next_category)[0]);
    } else {
      post_done(port);
    }
  }
  // if ($('.clicked').last().next().next().length > 0) {
  //   click_element($('.clicked').last().next());
  // } else if () {
  //   $('.clicked').first().next().parent().next()
  // }
}

parsers['www.shufersal.co.il'] = function(port) {
  function get_all_page_products() {
    var products = [];
    $('.PWdivProduct').each(function(index, element) {
      element = $(element);
      try {
        var product = {};
        product.site_id = parseInt(element.attr('ddpid'))
        product.image_small = $('.PImg img',element).attr('src');
        product.name = $('#divProductDetailsTexts a', element).text().trim();
        product.price = parseFloat($('#spnEffectivePrice', element).text().trim())
        product.brand = $('.ProdBoxSupplierText', element).text().trim()
        products.push(product);
      } catch (e) {
        log(e)
      }
    });

    return products;
  }

  var call_when_loaded = function(action, callback, timeout_sec) {
    var last_element_id = $('[id^="divProduct"]').last().attr('id');
    action();
    var timeout_counter = timeout_sec;
    var interval_ms = 100;
    var timeout_cb = function() {
      timeout_counter -= interval_ms / 1000;
      if ($('[id^="divProduct"]').last().attr('id') != last_element_id) {
        callback(false);
      } else if (timeout_counter < 0) {
        callback(true);
      } else {
        setTimeout(timeout_cb, interval_ms);
      }
    };
    setTimeout(timeout_cb, interval_ms)
  };

  var state = {}


  var parse_cat_3 = function(when_done) {
    if (state.cat3_idx < state.cat3.length) {
      call_when_loaded(function() {
        click_element(state.cat3[state.cat3_idx++])
      }, function(timeout_expired) {
        log('do stuff: ' + state.cat2_idx + ', ' + state.cat3_idx);
        var scroll_to_bottom = function(timeout_expired) {
          $('.rgDataDiv').scrollTop(9999);
          if (timeout_expired === true) {
            var products = get_all_page_products();
            if (products.length > 0) {
              post_objects(port, products);
            }
            parse_cat_3(when_done);
          } else if (timeout_expired === false) {
            call_when_loaded(scroll_to_bottom, scroll_to_bottom, 0.5);
          }
        }
        call_when_loaded(scroll_to_bottom, scroll_to_bottom, 0.5);
        // parse_cat_3(when_done);
      }, 5);
    } else {
      when_done();
    }
  }

  var parse_cat_2 = function(when_done) {
    if (state.cat2_idx < state.cat2.length) {
      call_when_loaded(function() {
        click_element(state.cat2[state.cat2_idx++])
      }, function(timeout_expired) {
        state.cat3_idx = 0;
        state.cat3 = $('[lv3cat]');
        parse_cat_3(function() {
          parse_cat_2(when_done);
        });
      }, 5);
    } else {
      when_done();
    }
  };

  var parse_cat_1 = function(when_done) {
    if (state.cat1_idx < state.cat1.length) {
      call_when_loaded(function() {
        click_element(state.cat1[state.cat1_idx++])
      }, function(timeout_expired) {
        state.cat2_idx = 0;
        state.cat2 = $('[lv1cat]');
        parse_cat_2(function() {
          parse_cat_1();
        });
      }, 5);
    } else {
      when_done();
    }
  };

  var react_to_change = function(timeout_status) {
    if (timeout_status === false) {
      log('timeout reached');
    }

    if ($('#ctl00_PlaceHolderMain_ucMain_ctlProductsView_ucDeliveryCity_ddlCityDeliveryPopup_Input').length > 0) {
      $('#ctl00_PlaceHolderMain_ucMain_ctlProductsView_ucDeliveryCity_ddlCityDeliveryPopup_Input').val('ירושלים') // jerusalem
      click_element($('#delivCityBtn')[0]);
    }

    if ($('.btnPCok2').length > 0) {
      click_element($('.btnPCok2')[0]);
    }

    if (state.cat1 === undefined) {
      state.cat1 = $('.cii');
      state.cat1_idx = 0;
      parse_cat_1(function() {
        log('done');
        post_done(port);
      });
    }

  };

  react_to_change();

  // call_when_loaded(react_to_change, react_to_change, 5)
}
