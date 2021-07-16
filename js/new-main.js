"use strict";

let allSkillAtoms = {};  // Associative array
let skillAtomsOnCanvas = [];
let skillAtomsInMenu = [];

let connectMode = false;
let connectingFrom;

let svg = d3.select('.main-canvas');
const layout = d3.sugiyama()  // Sugiyama method
               .decross(d3.decrossOpt())  // Try optimal decrossing; we might need to change this
               .nodeSize(() => [100, 100]);

// How to draw edges
const line = d3.line()
               .curve(d3.curveCatmullRom)  // Curved edges
               .x(d => d.x)  // Get x and y coordinates of each point along the edge
               .y(d => d.y);

$('#new-atom').click(function () {
  $('#new-atom-modal').css('display', 'block');
  $('#new-atom-modal input').val('');
  $('#atom-error').text("");
});

$('#new-base').click(function () {
  $('#new-base-modal').css('display', 'block');
  $('.modal input').val('');
  $('#base-error').text("");
});

$('#create-atom').click(newAtom);
function newAtom() {
  let name = $('#atom-name').val();
  let action = $('#action').val();
  let simulation = $('#simulation').val();
  let feedback = $('#feedback').val();
  let update = $('#update').val();
  if (allSkillAtoms.hasOwnProperty(name)) {
    $('#atom-error').text("A skill atom with that name already exists");
    return;
  }

  let newSkillAtom = new SkillAtom(name, action, simulation, feedback, update);
  allSkillAtoms[name] = newSkillAtom;
  skillAtomsOnCanvas.push(newSkillAtom);
  draw();

  $(this).parents('.modal-bg').css('display', 'none');
}

$('#create-base').click(newBase);
function newBase() {
  let name = $('#base-name').val();
  let source = $('#source').val();
  let knowledge = $('#knowledge').val();
  if (allSkillAtoms.hasOwnProperty(name)) {
    $('#base-error').text("A skill atom with that name already exists");
    return;
  }

  let newPriorKnowledge = new PriorKnowledge(name, source, knowledge);
  allSkillAtoms[name] = newPriorKnowledge;
  skillAtomsOnCanvas.push(newPriorKnowledge);
  draw();

  $(this).parents('.modal-bg').css('display', 'none');
}

$('.cancel').click(function () {
  $(this).parents('.modal-bg').css('display', 'none');
});

$('#update-atom').click(updateAtom);
function updateAtom() {
  let atom = $('#edit-atom-modal').get(0).target;
  let oldName = atom.skillName;
  delete allSkillAtoms[oldName];

  let name = $('#edit-atom-name').val();
  let action = $('#edit-action').val();
  let simulation = $('#edit-simulation').val();
  let feedback = $('#edit-feedback').val();
  let update = $('#edit-update').val();
  if (allSkillAtoms.hasOwnProperty(name)) {
    $('#edit-atom-error').text("A skill atom with that name already exists");
    return;
  }

  atom.skillName = name;
  atom.playerInput = action;
  atom.stateChange = simulation;
  atom.feedback = feedback;
  atom.knowledgeGrowth = update;
  allSkillAtoms[name] = atom;

  for (let child of skillAtomsOnCanvas) {
    if (child.parents.includes(oldName)) {
      child.parents = child.parents.filter(parent => (parent !== oldName));
      child.parents.push(name);
    }
  }

  let oldId = oldName.replace(/\s/g, '');
  let newId = name.replace(/\s/g, '');
  svg.select(`#${oldId}`)
     .text(name)
     .attr('id', newId);

  $(this).parents('.modal-bg').css('display', 'none');
}

$('#update-base').click(updateBase);
function updateBase() {
  let atom = $('#edit-base-modal').get(0).target;
  let oldName = atom.skillName;
  delete allSkillAtoms[oldName];

  let name = $('#edit-base-name').val();
  let source = $('#edit-source').val();
  let knowledge = $('#edit-knowledge').val();
  if (allSkillAtoms.hasOwnProperty(name)) {
    $('#edit-base-error').text("A skill atom with that name already exists");
    return;
  }

  atom.skillName = name;
  atom.skilSource = source;
  atom.knowledgeGrowth = knowledge;
  allSkillAtoms[name] = atom;

  for (let child of skillAtomsOnCanvas) {
    if (child.parents.includes(oldName)) {
      child.parents = child.parents.filter(parent => (parent !== oldName));
      child.parents.push(name);
    }
  }

  let oldId = oldName.replace(/\s/g, '');
  let newId = name.replace(/\s/g, '');
  svg.select(`#${oldId}`)
     .text(name)
     .attr('id', newId);

  $(this).parents('.modal-bg').css('display', 'none');
}

function draw() {
  d3.selectAll("svg > *").remove();  // Reset the SVG
  if (skillAtomsOnCanvas.length === 0) {
    return;
  }

  let stratify = d3.dagStratify()
                   .id(d => d.skillName)
                   .parentIds(d => d.parents);
  let dag = stratify(skillAtomsOnCanvas);
  let { width, height } = layout(dag);
  svg.attr('viewBox', `0, 0, ${width}, ${height}`);  // Set the size of the SVG

  svg.append('g')  // Append a group for the edges
     .selectAll('path')  // Select the (not yet existent) paths in the SVG
     .data(dag.links())  // Bind the paths to edges in the DAG
     .enter()  // Create "placeholders" for the edges
     .append('path')  // Add a path for each edge
     .attr('d', link => line(link.points))  // Use the above function to draw the paths
     .attr('fill', 'none')
     .attr('stroke-width', 3)
     .attr('stroke', 'black');

  let descendants = dag.descendants();
  let nodes = svg.append('g')  // Append another group for the nodes
                 .selectAll('g')  // Containers for each node; will have box and text
                 .data(descendants)  // Bind to the nodes in the DAG
                 .enter()  // Create placeholders
                 .append('g')  // Add containers
                 .attr('transform', node => `translate(${node.x}, ${node.y})`)  // Set position
                 .attr('class', 'node')
                 .on('click', connect)
                 .on('contextmenu', d3.contextMenu(menu));
  // TODO draw boxes
  nodes.append('text')  // Add text
       .text(node => node.data.skillName)  // Just use skillName as a placeholder
       .attr('id', node => node.data.skillName.replace(/\s/g, ''))
       .attr('text-anchor', 'middle')  // Center text in node
       .attr('alignment-baseline', 'middle');
}

function connect(event, d) {
  if (!connectMode) {
    connectMode = true;
    connectingFrom = d.data;
  } else {
    d.data.parents.push(connectingFrom.skillName);
    draw();
    connectMode = false;
  }
}

function menu(d) {
  let del = {
    title: 'Delete',
    action: d => {
      let name = d.data.skillName;
      skillAtomsOnCanvas = skillAtomsOnCanvas.filter(item => (item !== d.data));
      for (let item of skillAtomsOnCanvas) {
        item.parents = item.parents.filter(parent => parent !== name);
      }
      delete allSkillAtoms[name];

      draw();
    }
  };

  let parentName = d.data.skillName;
  let links = [];
  for (let child of skillAtomsOnCanvas) {
    if (child.parents.includes(parentName)) {
      let childName = child.skillName;
      let link = {
        title: childName,
        action: d => {
          child.parents = child.parents.filter(parent => (parent !== parentName));
          draw();
        }
      };
      links.push(link);
    }
  }

  let edit = {
    title: 'Edit',
    action: d => {
      let node = d.data;
      if (node instanceof SkillAtom) {
        let editDialog = $('#edit-atom-modal');
        editDialog.css('display', 'block');
        editDialog.get(0).target = node;  // It's JavaScript, we can do dumb things like this

        $('#edit-atom-name').val(node.skillName);
        $('#edit-action').val(node.playerInput);
        $('#edit-simulation').val(node.stateChange);
        $('#edit-feedback').val(node.feedback);
        $('#edit-update').val(node.knowledgeGrowth);
        $('#edit-atom-error').text("");
      } else {  // node instanceof PriorKnowledge
        let editDialog = $('#edit-base-modal');
        editDialog.css('display', 'block');
        editDialog.get(0).target = node;  // It's JavaScript, we can do dumb things like this

        $('#edit-base-name').val(node.skillName);
        $('#edit-source').val(node.skillSource);
        $('#edit-knowledge').val(node.knowledgeGrowth);
        $('#edit-base-error').text("");
      }
    }
  };

  return [
    del,
    {
      title: 'Remove Link',
      children: links,
      disabled: links.length === 0
    },
    edit
  ];
}
