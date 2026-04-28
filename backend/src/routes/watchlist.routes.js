'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/watchlist.controller');

router.use(authRequired);

router.get('/', ctrl.list);

router.post(
  '/',
  [
    body('name').isString().trim().isLength({ min: 1, max: 80 }),
    body('symbols').optional().isArray(),
    body('symbols.*').optional().isString().isLength({ min: 1, max: 12 }),
  ],
  validate,
  ctrl.create
);

router.get('/:id', [param('id').isMongoId()], validate, ctrl.getOne);

router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('symbols').optional().isArray(),
    body('symbols.*').optional().isString().isLength({ min: 1, max: 12 }),
  ],
  validate,
  ctrl.update
);

router.delete('/:id', [param('id').isMongoId()], validate, ctrl.remove);

router.post(
  '/:id/symbols',
  [param('id').isMongoId(), body('symbol').isString().isLength({ min: 1, max: 12 })],
  validate,
  ctrl.addSymbol
);

router.delete(
  '/:id/symbols/:symbol',
  [param('id').isMongoId(), param('symbol').isString().isLength({ min: 1, max: 12 })],
  validate,
  ctrl.removeSymbol
);

module.exports = router;
