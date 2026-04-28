'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/portfolio.controller');

router.use(authRequired);

router.get('/', ctrl.list);

router.post(
  '/',
  [
    body('name').isString().trim().isLength({ min: 1, max: 80 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('isDefault').optional().isBoolean(),
  ],
  validate,
  ctrl.create
);

router.get('/:id', [param('id').isMongoId()], validate, ctrl.getOne);
router.get('/:id/summary', [param('id').isMongoId()], validate, ctrl.summary);

router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('isDefault').optional().isBoolean(),
  ],
  validate,
  ctrl.update
);

router.delete('/:id', [param('id').isMongoId()], validate, ctrl.remove);

module.exports = router;
