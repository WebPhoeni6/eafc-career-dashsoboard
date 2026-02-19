const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./transfers.service');

const listOffers = asyncHandler(async (req, res) => {
  const data = await service.listOffers(req.user.id, req.params.careerId);
  return success(res, data, 'Offers loaded');
});

const createOffer = asyncHandler(async (req, res) => {
  const data = await service.createOffer(req.user.id, req.params.careerId, req.validated?.body || req.body);
  return success(res, data, 'Offer created', 201);
});

const updateOffer = asyncHandler(async (req, res) => {
  const data = await service.updateOffer(
    req.user.id,
    req.params.careerId,
    req.params.id,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Offer updated');
});

const deleteOffer = asyncHandler(async (req, res) => {
  await service.deleteOffer(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listContracts = asyncHandler(async (req, res) => {
  const data = await service.listContracts(req.user.id, req.params.careerId);
  return success(res, data, 'Contracts loaded');
});

const createContract = asyncHandler(async (req, res) => {
  const data = await service.createContract(req.user.id, req.params.careerId, req.validated?.body || req.body);
  return success(res, data, 'Contract created', 201);
});

const updateContract = asyncHandler(async (req, res) => {
  const data = await service.updateContract(
    req.user.id,
    req.params.careerId,
    req.params.id,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Contract updated');
});

const deleteContract = asyncHandler(async (req, res) => {
  await service.deleteContract(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listAgentNotes = asyncHandler(async (req, res) => {
  const data = await service.listAgentNotes(req.user.id, req.params.careerId);
  return success(res, data, 'Agent notes loaded');
});

const createAgentNote = asyncHandler(async (req, res) => {
  const data = await service.createAgentNote(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Agent note created', 201);
});

const deleteAgentNote = asyncHandler(async (req, res) => {
  await service.deleteAgentNote(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

module.exports = {
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  listContracts,
  createContract,
  updateContract,
  deleteContract,
  listAgentNotes,
  createAgentNote,
  deleteAgentNote,
};
