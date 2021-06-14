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

let images = [
  { obj: new Image(), src: "tile.png", left: 0, top:0, right:0, bottom: 0, width: 0, height: 0, isDragging: false },
  { obj: new Image(), src: "tile-wide.png", left: 100, top: 100, right: 0, bottom: 0, width: 0, height: 0, isDragging: false }
];

for (let img of images) {
  img.obj.src = img.src;
  img.obj.onload = function () {
    ctx.drawImage(img.obj, img.left, img.top);
    img.width = img.obj.width;
    img.right = img.left + img.width;
    img.height = img.obj.height;
    img.bottom = img.top + img.height;
  };
}

let canvasOffset = canvasJq.offset();
let lastX;
let lastY;
let dragging;

function startDrag(event) {
  event.preventDefault();
  event.stopPropagation();

  let mouseX = event.clientX - canvasOffset.left;
  let mouseY = event.clientY - canvasOffset.top;

  dragging = false;
  for (let img of images) {
    if (mouseX >= img.left && mouseX <= img.right &&
        mouseY >= img.top && mouseY <= img.bottom) {
      dragging = true;
      img.isDragging = true;
    }
  }

  lastX = mouseX;
  lastY = mouseY;
}

function drag(event) {
  if (dragging) {
    event.preventDefault();
    event.stopPropagation();

    let mouseX = event.clientX - canvasOffset.left;
    let mouseY = event.clientY - canvasOffset.top;
    let movementX = mouseX - lastX;
    let movementY = mouseY - lastY;

    for (let img of images) {
      if (img.isDragging) {
        img.left += movementX;
        img.right += movementX;
        img.top += movementY;
        img.bottom += movementY;
      }
    }

    lastX = mouseX;
    lastY = mouseY;

    draw();
  }
}

function stopDrag(event) {
  event.preventDefault();
  event.stopPropagation();

  dragging = false;
  for (let img of images) {
    img.isDragging = false;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let img of images) {
    ctx.drawImage(img.obj, img.left, img.top);
  }
}

canvasJq.mousedown(startDrag);
canvasJq.mousemove(drag);
canvasJq.mouseenter(function (event) {
  if (event.buttons === 1) {
    drag(event);
  } else {
    stopDrag(event);
  }
});
canvasJq.mouseup(stopDrag);
