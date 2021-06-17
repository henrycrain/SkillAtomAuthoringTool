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

let $canvas = $('.main-canvas');  // jQuery wrapper for canvas
let canvas = $canvas[0];  // The actual canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let atomsOnCanvas = [];

let ctx = canvas.getContext('2d');

let canvasOffset = $canvas.offset();
let lastX;
let lastY;
let dragging;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // The last placed object is on top
  // Since the user probably doesn't want objects to overlap anyway, I don't think its necessary to be able to reorder them
  // Objects have a uniform depth, so we can use the painter's algorithm
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
  if (event.dataTransfer) {  // If this is an actual event object
    event.dataTransfer.setData('text/uri-list', event.target.src);
    event.dataTransfer.setData('application/json', offsetStr);
  } else {  // Otherwise, this is a jQuery wrapper
    event.originalEvent.dataTransfer.setData('text/uri-list', event.target.src);
    event.originalEvent.dataTransfer.setData('application/json', offsetStr);
  }
}

function addAtom($event) {
  $event.preventDefault();
  let src = $event.originalEvent.dataTransfer.getData('text/uri-list');
  let offsetStr = $event.originalEvent.dataTransfer.getData('application/json');
  let offset = JSON.parse(offsetStr);

  let newAtom = {
    obj: new Image(),  // The actual image object
    src: src
  };

  newAtom.obj.src = newAtom.src;
  newAtom.obj.onload = function () {
    newAtom.width = newAtom.obj.width;
    newAtom.height = newAtom.obj.height;
    newAtom.left = $event.clientX - canvasOffset.left - offset.left * newAtom.width;
    newAtom.top = $event.clientY - canvasOffset.top - offset.top * newAtom.height;
    newAtom.right = newAtom.left + newAtom.width;
    newAtom.bottom = newAtom.top + newAtom.height;
    draw();
  };
  atomsOnCanvas.push(newAtom);
}

$('#atoms').children().on('dragstart', dragAtom);
$canvas.on('dragover', event => event.preventDefault());
$canvas.on('drop', addAtom);

function startDrag($event) {
  $event.preventDefault();
  $event.stopPropagation();

  let mouseX = $event.clientX - canvasOffset.left;
  let mouseY = $event.clientY - canvasOffset.top;

  // Only drag the top object
  for (let i = atomsOnCanvas.length - 1; i >= 0; i--) {
    let img = atomsOnCanvas[i];
    if (mouseX >= img.left && mouseX <= img.right &&
      mouseY >= img.top && mouseY <= img.bottom) {
      dragging = img;
      break;
    }
  }

  lastX = mouseX;
  lastY = mouseY;
}

function drag($event) {
  if (dragging) {
    $event.preventDefault();
    $event.stopPropagation();

    let mouseX = $event.clientX - canvasOffset.left;
    let mouseY = $event.clientY - canvasOffset.top;
    let movementX = mouseX - lastX;
    let movementY = mouseY - lastY;

    dragging.left += movementX;
    dragging.right += movementX;
    dragging.top += movementY;
    dragging.bottom += movementY;

    lastX = mouseX;
    lastY = mouseY;

    draw();
  }
}

function stopDrag($event) {
  $event.preventDefault();
  $event.stopPropagation();
  dragging = null;
}

$canvas.mousedown(startDrag);
$canvas.mousemove(drag);
$canvas.mouseenter(function (event) {
  if (event.buttons === 1) {
    drag(event);
  } else {
    stopDrag(event);
  }
});
$canvas.mouseup(stopDrag);

$.contextMenu({
  selector: '.main-canvas',
  build: function (element, $event) {
    let mouseX = $event.clientX - canvasOffset.left;
    let mouseY = $event.clientY - canvasOffset.top;

    let toDelete = null;
    for (let i = atomsOnCanvas.length - 1; i >= 0; i--) {
      let img = atomsOnCanvas[i];
      if (mouseX >= img.left && mouseX <= img.right &&
          mouseY >= img.top && mouseY <= img.bottom) {
        toDelete = img;
        break;
      }
    }

    return {
      items: {
        'delete': {
          name: 'Delete',
          icon: 'delete',
          disabled: (toDelete === null),
          callback: function () {
            atomsOnCanvas = atomsOnCanvas.filter(element => element !== toDelete);
            draw();
          }  // end callback
        }  // end delete
      },  // end items
      reposition: false
    };  // end return
  }  // end build
});
