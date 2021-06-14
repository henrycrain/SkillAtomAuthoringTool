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

let canvasJq = $('.main');  // jQuery wrapper for canvas
let canvas = canvasJq[0];  // The actual canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ctx = canvas.getContext('2d');
let img = new Image();
img.src = "tile.png";
img.onload = function () {
  ctx.drawImage(img, 0, 0);
};

let canvasOffset = canvasJq.offset();
let canvasMouseX;
let canvasMouseY;
let isDragging;

function startDrag(event) {
  canvasMouseX = event.clientX - canvasOffset.left;
  canvasMouseY = event.clientY - canvasOffset.top;
  isDragging = true;
}

function drag(event) {
  canvasMouseX = event.clientX - canvasOffset.left;
  canvasMouseY = event.clientY - canvasOffset.top;
  if (isDragging) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, canvasMouseX, canvasMouseY);
  }
}

function stopDrag(event) {
  canvasMouseX = event.clientX - canvasOffset.left;
  canvasMouseY = event.clientY - canvasOffset.top;
  isDragging = false;
}

canvasJq.mousedown(startDrag);
canvasJq.mousemove(drag);
canvasJq.mouseup(stopDrag);
