"use strict";

$('#new-atom').click(function () {
  $('#new-atom-modal').css('display', 'block');
});

$('#new-base').click(function () {
  $('#new-base-modal').css('display', 'block');
});

$('.create').click(function () {
  $(this).parents('.modal-bg').css('display', 'none');
});

$('.cancel').click(function () {
  $(this).parents('.modal-bg').css('display', 'none');
});
