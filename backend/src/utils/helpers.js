const crypto = require('crypto');

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function stageToEnum(value) {
  const map = {
    'N/A': 'NA',
    Group: 'Group',
    'Round of 16': 'RoundOf16',
    'Quarter-Final': 'QuarterFinal',
    'Semi-Final': 'SemiFinal',
    Final: 'Final',
  };
  return map[value] || 'NA';
}

function enumToStage(value) {
  const map = {
    NA: 'N/A',
    Group: 'Group',
    RoundOf16: 'Round of 16',
    QuarterFinal: 'Quarter-Final',
    SemiFinal: 'Semi-Final',
    Final: 'Final',
  };
  return map[value] || 'N/A';
}

function skillCategoryToEnum(value) {
  const map = {
    Pace: 'Pace',
    Dribbling: 'Dribbling',
    Finishing: 'Finishing',
    Passing: 'Passing',
    Physicality: 'Physicality',
    Defending: 'Defending',
    'Weak Foot': 'WeakFoot',
    'Skill Moves': 'SkillMoves',
    Other: 'Other',
  };
  return map[value] || 'Other';
}

function enumToSkillCategory(value) {
  const map = {
    Pace: 'Pace',
    Dribbling: 'Dribbling',
    Finishing: 'Finishing',
    Passing: 'Passing',
    Physicality: 'Physicality',
    Defending: 'Defending',
    WeakFoot: 'Weak Foot',
    SkillMoves: 'Skill Moves',
    Other: 'Other',
  };
  return map[value] || 'Other';
}

function emptyStringToNull(value) {
  return value === '' ? null : value;
}

function nullToEmptyString(value) {
  return value === null || value === undefined ? '' : value;
}

module.exports = {
  hashToken,
  stageToEnum,
  enumToStage,
  skillCategoryToEnum,
  enumToSkillCategory,
  emptyStringToNull,
  nullToEmptyString,
};
