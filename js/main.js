"use strict";

let $canvas = $('.main-canvas');  // jQuery wrapper for canvas
let canvas = $canvas.get(0);  // The actual canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let allSkillAtoms = {};  // Associative array
let skillAtomsInMenu = [];
let skillAtomsOnCanvas = [];

let ctx = canvas.getContext('2d');
let canvasOffset = $canvas.offset();

let highlighted = null;
const HIGHLIGHT_CIRCLE_RADIUS = 5;

let dragging = null;
let lastX;
let lastY;

let draggingFrom = null;
let dragPoint;
const DragPointEnum = {
  TOP: 0,
  RIGHT: 1,
  BOTTOM: 2,
  LEFT: 3
};
let arrowX;
let arrowY;

function addToMenu(atom) {
  skillAtomsInMenu.push(atom);
  $('#menu').append(atom.image);
}

function removeFromMenu(atom) {
  skillAtomsInMenu = skillAtomsInMenu.filter(element => element !== atom);
  $(`#${atom.image.id}`).remove();
}

function addToCanvas(atom) {
  skillAtomsOnCanvas.push(atom);
  draw();
}

function removeFromCanvas(atom) {
  skillAtomsOnCanvas = skillAtomsOnCanvas.filter(element => element !== atom);
  draw();
}

// Source: https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
function getMousePos(clientX, clientY) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

function getSkillAtomUnderCursor(x, y) {
  for (let i = skillAtomsOnCanvas.length - 1; i >= 0; i--) {
    let atom = skillAtomsOnCanvas[i];
    if (x >= atom.left && x <= atom.right  &&
        y >= atom.top  && y <= atom.bottom ) {
      return atom;
    }
  }
  return null;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // The last placed object is on top
  // Since the user probably doesn't want objects to overlap anyway, I don't think its necessary to be able to reorder them
  // Objects have a uniform depth, so we can use the painter's algorithm
  for (let atom of skillAtomsOnCanvas) {
    let img = atom.image;
    ctx.drawImage(img, atom.left, atom.top, atom.image.naturalWidth, atom.image.naturalHeight);

    if (atom === highlighted) {
      let midX = (highlighted.left + highlighted.right) / 2;
      let midY = (highlighted.top + highlighted.bottom) / 2;

      ctx.beginPath();
      ctx.arc(midX, highlighted.top, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(highlighted.right, midY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(midX, highlighted.bottom, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(highlighted.left, midY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
    }
  }

  for (let atom of skillAtomsOnCanvas) {
    for (let child of atom.children) {
      drawArrow((atom.left + atom.right) / 2, atom.bottom, (child.left + child.right) / 2, child.top);
    }
  }

  if (draggingFrom) {
    let startX = 0;
    let startY = 0;
    let midX = (draggingFrom.left + draggingFrom.right) / 2;
    let midY = (draggingFrom.top + draggingFrom.bottom) / 2;
    switch (dragPoint) {
      case DragPointEnum.TOP:
        startX = midX;
        startY = draggingFrom.top;
        break;
      case DragPointEnum.RIGHT:
        startX = draggingFrom.right;
        startY = midY;
        break;
      case DragPointEnum.BOTTOM:
        startX = midX;
        startY = draggingFrom.bottom;
        break;
      case DragPointEnum.LEFT:
        startX = draggingFrom.left;
        startY = midY;
    }
    drawArrow(startX, startY, arrowX, arrowY);
  }
}

function drawArrow(fromX, fromY, toX, toY) {
  const HEAD_LENGTH = 10; // length of head in pixels
  let dx = toX - fromX;
  let dy = toY - fromY;
  let angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineTo(toX - HEAD_LENGTH * Math.cos(angle - Math.PI / 6), toY - HEAD_LENGTH * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - HEAD_LENGTH * Math.cos(angle + Math.PI / 6), toY - HEAD_LENGTH * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

$('#new-atom').click(function () {
  $('#new-atom-modal').css('display', 'block');
  $('.modal input').val('');
  $('#atom-error').text("");
});

$('#new-base').click(function () {
  $('#new-base-modal').css('display', 'block');
  $('.modal input').val('');
  $('#base-error').text("");
});

$('#create-atom').click(newAtom);
$('#create-base').click(newBase);

function newAtom() {
  let name = "Name- "+$('#atom-name').val();
  let action = "Action- "+$('#action').val();
  let simulation = "Simulation- "+$('#simulation').val();
  let feedback = "Feedback- "+$('#feedback').val();
  let update = "Update- "+$('#update').val();
  if (allSkillAtoms.hasOwnProperty(name)) {
    $('.error').text("A skill atom with that name already exists");
    return;
  }

  let newSkillAtom = new SkillAtom(name, action, simulation, feedback, update);

  let textCanvas = $('#text-canvas').get(0);
  let textCtx = textCanvas.getContext('2d');
  textCtx.font = '25px sans-serif';  // Set the font here so the width will be right
  textCanvas.width = Math.max(...[name, action, simulation, feedback, update].map(text => textCtx.measureText(text).width))+10;
  textCanvas.height = 115;
  textCtx.font = '25px sans-serif';  // Have to set it again because we changed the width and height
  textCtx.fillText(name, 5, 25);
  textCtx.fillText(action, 5, 45);
  textCtx.fillText(simulation, 5, 65);
  textCtx.fillText(feedback, 5, 85);
  textCtx.fillText(update, 5, 105);

  newSkillAtom.image = new Image();
  newSkillAtom.image.src = textCanvas.toDataURL();
  newSkillAtom.image.id = newSkillAtom.skillName.replace(/\s/g, '');
  newSkillAtom.image.onload = function () {
    addToMenu(newSkillAtom);
    allSkillAtoms[name] = newSkillAtom;
    newSkillAtom.image.ondragstart = dragAtomFromMenu;
  };

  $(this).parents('.modal-bg').css('display', 'none');
}

function newBase() {
  let name = "Name- "+$('#base-name').val();
  let source = "Source- "+$('#source').val();
  let knowledge = "Knowledge- "+$('#knowledge').val();
  if (allSkillAtoms.hasOwnProperty(name)) {
    $('.error').text("A skill atom with that name already exists");
    return;
  }

  let newPriorKnowledge = new PriorKnowledge(name, source, knowledge);

  let textCanvas = $('#text-canvas').get(0);
  let textCtx = textCanvas.getContext('2d');
  textCtx.font = '20px sans-serif';  // Set the font here so the width will be right
  textCanvas.width = Math.max(...[name, source, knowledge].map(text => textCtx.measureText(text).width))+10;
  textCanvas.height = 75;
  textCtx.font = '20px sans-serif';  // Have to set it again because we changed the width and height
  textCtx.fillText(name, 5, 25);
  textCtx.fillText(source, 5, 45);
  textCtx.fillText(knowledge, 5, 65);

  newPriorKnowledge.image = new Image();
  newPriorKnowledge.image.src = textCanvas.toDataURL();
  newPriorKnowledge.image.id = newPriorKnowledge.skillName.replace(/\s/g, '');
  newPriorKnowledge.image.onload = function () {
    addToMenu(newPriorKnowledge);
    allSkillAtoms[name] = newPriorKnowledge;
    newPriorKnowledge.image.ondragstart = dragAtomFromMenu;
  };

  $(this).parents('.modal-bg').css('display', 'none');
}

function dragAtomFromMenu(event) {  // Note that this is a vanilla event object
  let atom = skillAtomsInMenu.find(atom => atom.image === event.target);

  let coords = event.target.getBoundingClientRect();
  let offsetX = event.clientX - coords.x;
  let offsetY = event.clientY - coords.y;
  // Proportional offsets because atoms are bigger on the canvas than in the list
  let offset = { left: offsetX / event.target.width, top: offsetY / event.target.height };

  let xferObj = { atom: atom, offset: offset };
  let xferStr = JSON.stringify(xferObj);
  if (event.dataTransfer) {  // If this is an actual event object
    event.dataTransfer.setData('application/json', xferStr);
    // Image object doesn't transfer in JSON, so we have to transfer the ID
    event.dataTransfer.setData('text', event.target.id);
  }
}

$('.cancel').click(function () {
  $(this).parents('.modal-bg').css('display', 'none');
});


$canvas.on('dragover', event => event.preventDefault());
$canvas.on('drop', dropAtomOnCanvas);

function dropAtomOnCanvas($event) {
  $event.preventDefault();
  let xferStr = $event.originalEvent.dataTransfer.getData('application/json');
  let xferObj = JSON.parse(xferStr);
  let atom = xferObj.atom;
  let offset = xferObj.offset;
  let imgId = $event.originalEvent.dataTransfer.getData('text');
  atom.image = document.getElementById(imgId);
  removeFromMenu(atom);

  // We store coordinates on the atom object, not the image object
  // This is a little odd, but makes things easier
  atom.left = $event.clientX - canvasOffset.left - offset.left * atom.image.naturalWidth;
  atom.top = $event.clientY - canvasOffset.top - offset.top * atom.image.naturalHeight;
  atom.right = atom.left + atom.image.naturalWidth;
  atom.bottom = atom.top + atom.image.naturalHeight;
  addToCanvas(atom);
}

$canvas.mousedown(clickOnCanvas);
$canvas.mousemove(mouseOverCanvas);
$canvas.mouseenter(function ($event) {
  if ($event.buttons === 1) {
    mouseOverCanvas($event);
  } else {
    mouseUpOnCanvas($event);
  }
});
$canvas.mouseleave(function () {
  highlighted = null;
  draw();
});
$canvas.mouseup(mouseUpOnCanvas);

function clickOnCanvas($event) {
  $event.preventDefault();
  $event.stopPropagation();
  let mousePos = getMousePos($event.clientX, $event.clientY);

  // The top object is already highlighted, so we don't need to check separately
  if (highlighted) {
    let highlightMidX = (highlighted.left + highlighted.right) / 2;
    let highlightMidY = (highlighted.top + highlighted.bottom) / 2;

    let distTop = Math.hypot(mousePos.x - highlightMidX, mousePos.y - highlighted.top);
    let distRight = Math.hypot(mousePos.x - highlighted.right, mousePos.y - highlightMidY);
    let distBottom = Math.hypot(mousePos.x - highlightMidX, mousePos.y - highlighted.bottom);
    let distLeft = Math.hypot(mousePos.x - highlighted.left, mousePos.y - highlightMidY);

    if (distTop < HIGHLIGHT_CIRCLE_RADIUS) {
      draggingFrom = highlighted;
      highlighted = null;
      dragPoint = DragPointEnum.TOP;
    } else if (distRight < HIGHLIGHT_CIRCLE_RADIUS) {
      draggingFrom = highlighted;
      highlighted = null;
      dragPoint = DragPointEnum.RIGHT;
    } else if (distBottom < HIGHLIGHT_CIRCLE_RADIUS) {
      draggingFrom = highlighted;
      highlighted = null;
      dragPoint = DragPointEnum.BOTTOM;
    } else if (distLeft < HIGHLIGHT_CIRCLE_RADIUS) {
      draggingFrom = highlighted;
      highlighted = null;
      dragPoint = DragPointEnum.LEFT;
    } else {  // Not clicking on a circle
      dragging = highlighted;
      highlighted = null;
      lastX = mousePos.x;
      lastY = mousePos.y;
    }
  }
}

function mouseOverCanvas($event) {
  $event.preventDefault();
  $event.stopPropagation();
  let mousePos = getMousePos($event.clientX, $event.clientY);

  if (dragging) {
    dragSkillAtom(mousePos.x, mousePos.y);
  } else if (draggingFrom) {
    dragArrow(mousePos.x, mousePos.y);
  } else {
    handleHighlight(mousePos.x, mousePos.y);
  }
}

function dragSkillAtom(x, y) {
  let movementX = x - lastX;
  let movementY = y - lastY;

  dragging.left += movementX;
  dragging.right += movementX;
  dragging.top += movementY;
  dragging.bottom += movementY;

  lastX = x;
  lastY = y;
  draw();
}

function dragArrow(x, y) {
  arrowX = x;
  arrowY = y;
  console.log(arrowX, arrowY);
  draw();
}

function mouseUpOnCanvas($event) {
  $event.preventDefault();
  $event.stopPropagation();
  let mousePos = getMousePos($event.clientX, $event.clientY);

  dragging = null;

  if (draggingFrom) {
    let newChild = getSkillAtomUnderCursor(mousePos.x, mousePos.y);
    if (newChild) {
      draggingFrom.children.push(newChild);
    }
    draggingFrom = null;
  }

  handleHighlight(mousePos.x, mousePos.y);
  draw();
}

function handleHighlight(x, y) {
  let oldHighlight = highlighted;
  highlighted = getSkillAtomUnderCursor(x, y);
  if (highlighted !== oldHighlight) {
    draw();
  }
}

$.contextMenu({
  selector: '.main-canvas',
  build: function ($element, $event) {
    let mousePos = getMousePos($event.clientX, $event.clientY);

    let clicked = null;
    for (let i = skillAtomsOnCanvas.length - 1; i >= 0; i--) {
      let atom = skillAtomsOnCanvas[i];
      if (mousePos.x >= atom.left && mousePos.x <= atom.right &&
          mousePos.y >= atom.top && mousePos.y <= atom.bottom) {
        clicked = atom;
        break;
      }
    }

    let linksObj = {};
    if (clicked !== null) {
      for (let child of clicked.children) {
        linksObj[child.skillName] = {
          name: child.skillName,
          callback: function () {
            clicked.children = clicked.children.filter(item => item !== child);
            draw();
          }
        };
      }
    }

    return {
      items: {
        'delete': {
          name: 'Remove',
          icon: 'delete',
          disabled: (clicked === null),
          callback: function () {
            removeFromCanvas(clicked);
            addToMenu(clicked);
          }
        },
        'delete-link': {
          name: 'Remove Link',
          disabled: (clicked === null || clicked.children.length === 0),
          items: linksObj
        }
      },  // end items
      reposition: false
    };  // end return
  }  // end build
});

$.contextMenu({
  selector: '#menu img',
  build: function ($element) {
    return {
      items: {
        'delete': {
          name: 'Delete',
          icon: 'delete',
          callback: function () {
            let atom = skillAtomsInMenu.find(atom => atom.image === $element.get(0));
            removeFromMenu(atom);
            delete allSkillAtoms[atom.skillName];
            for (let i in allSkillAtoms) {
              console.log(i);
            }
          }  // end callback
        }  // end delete
      },  // end items
      reposition: false
    };  // end return
  }  // end build
});
