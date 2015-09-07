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
        product.image_small = $('.PImg img', element).attr('src');
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


parsers['www.facebook.com'] = function(port) {
  run(port);
}

var get_next_friend = function(mark_current_as_done) {
  var friends = storage.get('friends', {});
  if (mark_current_as_done) {
    var current_friend = storage.get('current_friend', undefined);
    if (current_friend !== undefined) {
      friends[current_friend] = true;
      storage.set('friends', friends);
    }
  }

  for (f in friends) {
    if (friends[f] === false) {
      storage.set('current_friend', f);
      return f;
    }
  }

  return undefined
}

var get_all_photos = function(port) {
  var object = {}

  var $photo = $('#fbPhotoImage');
  var $high_res_photo = $('.fbPhotosPhotoActionsItem[rel="ignore"]');
  if ($high_res_photo.length > 0) {
    object.photo = $high_res_photo.attr('href');
  } else if ($photo.length > 0) {
    object.photo = $photo.attr('src');
  }

  if (object.photo) {
    object.tags = [];
    var $tags = $('.fbPhotosPhotoTagboxBase.tagBox');
    $tags.each(function(index, $element) {
      $element = $($element);
      var tag = {};
      tag.id = $element.attr('id');
      tag.position = $element.attr('style');
      object.tags.push(tag);

    });

    if (object.tags.length > 0) {
      post_objects(port, [object]);
    }

    var photo_path = object.photo.split('?')[0];
    var visited = storage.get('visited', {});
    if (visited.hasOwnProperty(photo_path)) {
      log('done all photos')

      navigate_to_next_friend(port);

    } else {
      visited[photo_path] = true;
      storage.set('visited', visited);
      if ($('.snowliftPager.next.hilightPager').length) {
        click_element($('.snowliftPager.next.hilightPager')[0]);
      } else if ($('.photoPageNextNav').length) {
        click_element($('.photoPageNextNav')[0]);
      }
    }
    // } else if ($('.fbPhotoViewLarger.fbPhotosPhotoActionsItem').length) {
    // $('.fbPhotoViewLarger.fbPhotosPhotoActionsItem').attr('id', 'js_0');
    // click_element($('.fbPhotoViewLarger.fbPhotosPhotoActionsItem')[0])
    // setTimeout(function() {
    //   // get_all_photos(port);
    // }, 2000)
  }


};

function scroll_all_friends(done) {
  scroll_all_friends.friend_count = 0;
  var scroll_down = function() {
    if (this.friend_count != $('.uiProfileBlockContent').length) {
      this.friend_count = $('.uiProfileBlockContent').length;
      $('body').scrollTop(999999999999);
      setTimeout($.proxy(scroll_down, this), 1000);
    } else {
      done();
    }
  }
  $.proxy(scroll_down, scroll_all_friends)();
  //    done(); // testing
}

function navigate_to_next_friend(port) {
  var friend_id = get_next_friend(true);
  if (friend_id) {
    navigate(port, 'https://www.facebook.com/' + friend_id);
  }
}

function get_all_friends(port) {
  scroll_all_friends(function() {
    var friend_count = $('.uiProfileBlockContent').length;
    log('friend count:' + friend_count);
    var friends = storage.get('firends', {})
    $('[data-gt]', $('.uiProfileBlockContent')).each(function(index, element) {
      try {
        friend = JSON.parse($(element).attr('data-gt'));
        var f_id = friend.engagement.eng_tid;
        if (!friends.hasOwnProperty(f_id)) {
          friends[f_id] = false
        }
      } catch (e) {

      }
    });


    log('saving firends: ' + friends.length)
    storage.set('friends', friends);
    navigate_to_next_friend(port);
    // log(JSON.stringify(friends))
  });
}

function run(port) {
  var location_parts = window.location.pathname.split('/')
    // return;
  if (location_parts[2] == 'friends') {
    get_all_friends(port);
  } else if (location.pathname.startsWith('/photo')) {
    get_all_photos(port);
  } else if (location_parts.length == 2) {
    navigate(port, 'https://www.facebook.com' + location.pathname + '/photos/');
  } else if (location_parts[location_parts.length - 1] == 'photos') {
    if ($('.uiMediaThumb').length) {
      click_element($('.uiMediaThumb')[0])
    } else if ($('.albumThumbLink').length) {
      click_element($('.albumThumbLink').first()[0])
    } else {
      navigate_to_next_friend(port);
    }
  } else if (location_parts[1] == 'media' || location_parts[2].startsWith('media_set')) {
    if ($('.uiMediaThumbImg').length) {
      click_element($('.uiMediaThumbImg').parent().parent().parent().first()[0])
    } else {
      navigate_to_next_friend(port);
    }
  }
}
