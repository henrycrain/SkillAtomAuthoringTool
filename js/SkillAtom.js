function SkillAtom(skillName, playerInput, stateChange, feedback, knowledgeGrowth) {
  this.skillName = skillName;
  this.playerInput = playerInput;
  this.stateChange = stateChange;
  this.feedback = feedback;
  this.knowledgeGrowth = knowledgeGrowth;

  this.parents = [];
}
