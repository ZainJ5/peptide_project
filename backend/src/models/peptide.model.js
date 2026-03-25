'use strict';

const { Peptide } = require('./index');

async function findById(id) {
  return Peptide.findByPk(id);
}

module.exports = {
  findById,
};
