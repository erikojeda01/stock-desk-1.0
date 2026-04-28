'use strict';

const router = require('express').Router();
const { body, param, query } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/trade.controller');

router.use(authRequired);

router.get(
  '/',
  [
    query('symbol').optional().isString(),
    query('from').optional().isString(),
    query('to').optional().isString(),
  ],
  validate,
  ctrl.list
);

router.post(
  '/',
  [
    body('symbol').isString().isLength({ min: 1, max: 12 }),
    body('type').isIn(['buy', 'sell']),
    body('date').isString().isLength({ min: 8, max: 25 }),
    body('shares').isFloat({ gt: 0 }),
    body('entry').isFloat({ min: 0 }),
    body('exit').isFloat({ min: 0 }),
    body('sl').optional({ nullable: true }).isFloat({ min: 0 }),
    body('tp').optional({ nullable: true }).isFloat({ min: 0 }),
    body('notes').optional().isString().isLength({ max: 5000 }),
  ],
  validate,
  ctrl.create
);

router.post('/bulk', ctrl.bulkImport);

router.get('/:id', [param('id').isMongoId()], validate, ctrl.getOne);
router.patch('/:id', [param('id').isMongoId()], validate, ctrl.update);
router.delete('/:id', [param('id').isMongoId()], validate, ctrl.remove);

module.exports = router;
