"use strict";

$('#new-atom').click(function () {
  $('#new-atom-modal').css('display', 'block');
});

$('#new-base').click(function () {
  $('#new-base-modal').css('display', 'block');
});

function newAtom() {
  let img = new Image();
  img.src = "tile.png";  // Placeholder
  img.onload = function () {
    $('#atoms').append(img);
    img.ondragstart = dragAtom;
  };

  $(this).parents('.modal-bg').css('display', 'none');
}

function newBase() {
  let img = new Image();
  img.src = "tile.png";  // Placeholder
  img.onload = function () {
    $('#atoms').append(img);
    img.ondragstart = dragAtom;
  };

  $(this).parents('.modal-bg').css('display', 'none');
}

$('#create-atom').click(newAtom);
$('#create-base').click(newBase);

$('.cancel').click(function () {
  $(this).parents('.modal-bg').css('display', 'none');
});

let canvasJq = $('.main');  // jQuery wrapper for canvas
let canvas = canvasJq[0];  // The actual canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let atomsOnCanvas = [];

let ctx = canvas.getContext('2d');

let canvasOffset = canvasJq.offset();
let lastX;
let lastY;
let dragging;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let img of atomsOnCanvas) {
    ctx.drawImage(img.obj, img.left, img.top);
  }
}

function dragAtom(event) {
  let coords = event.target.getBoundingClientRect();
  let offsetX = event.clientX - coords.x;
  let offsetY = event.clientY - coords.y;
  // Proportional offsets because atoms are bigger on the canvas than in the list
  let offset = { left: offsetX / event.target.width, top: offsetY / event.target.height };
  let offsetStr = JSON.stringify(offset);
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/uri-list', event.target.src);
    event.dataTransfer.setData('application/json', offsetStr);
  } else {
    event.originalEvent.dataTransfer.setData('text/uri-list', event.target.src);
    event.originalEvent.dataTransfer.setData('application/json', offsetStr);
  }
}

function addAtom(event) {
  event.preventDefault();
  let src = event.originalEvent.dataTransfer.getData('text/uri-list');
  let offsetStr = event.originalEvent.dataTransfer.getData('application/json');
  let offset = JSON.parse(offsetStr);

  let newAtom = {
    obj: new Image(),  // The actual image object
    src: src,
    isDragging: false
  };

  newAtom.obj.src = newAtom.src;
  newAtom.obj.onload = function () {
    newAtom.width = newAtom.obj.width;
    newAtom.height = newAtom.obj.height;
    newAtom.left = event.clientX - canvasOffset.left - offset.left * newAtom.width;
    newAtom.top = event.clientY - canvasOffset.top - offset.top * newAtom.height;
    newAtom.right = newAtom.left + newAtom.width;
    newAtom.bottom = newAtom.top + newAtom.height;
    draw();
  };
  atomsOnCanvas.push(newAtom);
}

$('#atoms').children().on('dragstart', dragAtom);
canvasJq.on('dragover', event => event.preventDefault());
canvasJq.on('drop', addAtom);

// TODO Currently, dragging overlapping objects drags all of them, which might not be expected behavior
// TODO To change this, I think we would need to assign z-indices to the images
function startDrag(event) {
  event.preventDefault();
  event.stopPropagation();

  let mouseX = event.clientX - canvasOffset.left;
  let mouseY = event.clientY - canvasOffset.top;

  dragging = false;
  for (let img of atomsOnCanvas) {
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

    for (let img of atomsOnCanvas) {
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
  for (let img of atomsOnCanvas) {
    img.isDragging = false;
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
