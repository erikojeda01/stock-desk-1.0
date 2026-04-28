'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/journal.controller');

router.use(authRequired);

router.get('/', ctrl.list);

router.post(
  '/',
  [
    body('date').isString().isLength({ min: 8, max: 25 }),
    body('mood').optional().isIn(['Bullish', 'Bearish', 'Neutral']),
    body('reflection').isString().isLength({ min: 1, max: 10000 }),
  ],
  validate,
  ctrl.create
);

router.get('/by-date/:date', [param('date').isString().isLength({ min: 8, max: 25 })], validate, ctrl.getByDate);

router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('date').optional().isString(),
    body('mood').optional().isIn(['Bullish', 'Bearish', 'Neutral']),
    body('reflection').optional().isString().isLength({ min: 1, max: 10000 }),
  ],
  validate,
  ctrl.update
);

router.delete('/:id', [param('id').isMongoId()], validate, ctrl.remove);

module.exports = router;
