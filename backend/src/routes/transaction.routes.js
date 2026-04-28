'use strict';

const router = require('express').Router();
const { body, param, query } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/transaction.controller');

router.use(authRequired);

router.get(
  '/',
  [
    query('portfolio').optional().isMongoId(),
    query('symbol').optional().isString(),
    query('type').optional().isIn(['BUY', 'SELL', 'buy', 'sell']),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.list
);

router.post(
  '/',
  [
    body('portfolio').isMongoId(),
    body('symbol').isString().isLength({ min: 1, max: 12 }),
    body('type').isIn(['BUY', 'SELL', 'buy', 'sell']),
    body('quantity').isFloat({ gt: 0 }),
    body('price').isFloat({ min: 0 }),
    body('fee').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('note').optional().isString().isLength({ max: 500 }),
    body('executedAt').optional().isISO8601(),
  ],
  validate,
  ctrl.create
);

router.post(
  '/trade',
  [
    body('portfolio').isMongoId(),
    body('symbol').isString().isLength({ min: 1, max: 12 }),
    body('type').isIn(['BUY', 'SELL', 'buy', 'sell']),
    body('quantity').isFloat({ gt: 0 }),
    body('fee').optional().isFloat({ min: 0 }),
    body('note').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  ctrl.trade
);

router.get('/:id', [param('id').isMongoId()], validate, ctrl.getOne);
router.delete('/:id', [param('id').isMongoId()], validate, ctrl.remove);

module.exports = router;
