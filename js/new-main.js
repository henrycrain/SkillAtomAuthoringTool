"use strict";

let allSkillAtoms = {};  // Associative array
let skillAtomsOnCanvas = [];
let skillAtomsInMenu = [];

let svg = d3.select('.main-canvas');
const layout = d3.sugiyama()  // Sugiyama method
               .decross(d3.decrossOpt())  // Try optimal decrossing; we might need to change this
               .nodeSize(() => [100, 100]);

// How to draw edges
const line = d3.line()
               .curve(d3.curveCatmullRom)  // Curved edges
               .x(d => d.x)  // Get x and y coordinates of each point along the edge
               .y(d => d.y);

let draggingFrom = null;
let arrowX;
let arrowY;

function draw() {
  let dag = d3.dagHierarchy()(...skillAtomsOnCanvas);
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

  if (draggingFrom) {
    svg.append('g')  // New group for dragging link
       .attr('d', `M ${draggingFrom.x},${draggingFrom.y} L ${arrowX},${arrowY}`)
       .attr('fill', 'none')
       .attr('stroke-width', 3)
       .attr('stroke', 'black');
  }

  let descendants = dag.descendants();
  let nodes = svg.append('g')  // Append another group for the nodes
                 .selectAll('g')  // Containers for each node; will have box and text
                 .data(descendants)  // Bind to the nodes in the DAG
                 .enter()  // Create placeholders
                 .append('g')  // Add containers
                 .attr('transform', node => `translate(${node.x}, ${node.y})`);  // Set position
  // TODO draw boxes
  nodes.append('text')  // Add text
       .text(node => node.data.skillName)  // Just use skillName as a placeholder
       .attr('text-anchor', 'middle')  // Center text in node
       .attr('alignment-baseline', 'middle');
}

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
$('#create-base').click(newBase);

function newAtom() {
  let name = $('#atom-name').val();
  let action = $('#action').val();
  let simulation = $('#simulation').val();
  let feedback = $('#feedback').val();
  let update = $('#update').val();
  if (allSkillAtoms.hasOwnProperty(name)) {
    $('#base-error').text("A skill atom with that name already exists");
    return;
  }

  let newSkillAtom = new SkillAtom(name, action, simulation, feedback, update);
  allSkillAtoms[name] = newSkillAtom;
  skillAtomsOnCanvas.push(newSkillAtom);
  draw();

  $(this).parents('.modal-bg').css('display', 'none');
}

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
