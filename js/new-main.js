"use strict";

// Hardcoded placeholder data
let arrowKeys = new PriorKnowledge("Arrow Keys", "Other games", "Arrow keys are movement keys");
let move = new SkillAtom("Move", "Left Arrow or Right Arrow", "Move player", "Sprite moves", "I can move with the arrow keys");
arrowKeys.children.push(move);
let pickUp = new SkillAtom("Pick Up", "X", "Pick up item", "Picking up animation", "I can pick up items");
move.children.push(pickUp);

let data = {
  skillName: "Arrow Keys",
  skillSource: "Other games",
  knowledgeGrowth: "Arrow keys are movement keys"
};

// Data already has a hierarchical structure
// No need for custom children operator because we already have "children" field
let dag = d3.dagHierarchy()(data);
let layout = d3.sugiyama()  // Sugiyama method
               .decross(d3.decrossOpt())  // Try optimal decrossing; we might need to change this
               .nodeSize(() => [1000, 100]);

let { width, height } = layout(dag);
let svg = d3.select('.main-canvas')
            .attr('viewBox', `0, 0, ${width}, ${height}`);  // Set the size of the SVG

// How to draw edges
const line = d3.line()
               .curve(d3.curveCatmullRom)  // Curved edges
               .x(d => d.x)  // Get x and y coordinates of each point along the edge
               .y(d => d.y);

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
               .attr('transform', node => `translate(${node.x}, ${node.y})`);  // Set position
// TODO draw boxes
nodes.append('text')  // Add text
     .text(node => node.data.skillName)  // Just use skillName as a placeholder
     .attr('text-anchor', 'middle')  // Center text in node
     .attr('alignment-baseline', 'middle')
