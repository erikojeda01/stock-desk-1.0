'use strict';

const router = require('express').Router();
const { body, param, query } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/holding.controller');

router.use(authRequired);

router.get('/', [query('portfolio').optional().isMongoId()], validate, ctrl.list);
router.get('/:id', [param('id').isMongoId()], validate, ctrl.getOne);

router.post(
  '/',
  [
    body('portfolio').isMongoId(),
    body('symbol').isString().trim().isLength({ min: 1, max: 12 }),
    body('quantity').isFloat({ min: 0 }),
    body('averageCost').isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  ],
  validate,
  ctrl.create
);

router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('quantity').optional().isFloat({ min: 0 }),
    body('averageCost').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  ],
  validate,
  ctrl.update
);

router.delete('/:id', [param('id').isMongoId()], validate, ctrl.remove);

module.exports = router;
