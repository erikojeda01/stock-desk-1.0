'use strict';

const router = require('express').Router();
const { param, query } = require('express-validator');

const validate = require('../middleware/validate');
const ctrl = require('../controllers/stock.controller');

// Public market data — no auth required so the homepage can show quotes.
router.get('/', ctrl.listAll);
router.get('/search', [query('q').optional().isString().isLength({ max: 60 })], validate, ctrl.search);
router.get('/quotes', [query('symbols').optional().isString()], validate, ctrl.getQuotes);
router.get('/:symbol', [param('symbol').isString().isLength({ min: 1, max: 12 })], validate, ctrl.getQuote);
router.get(
  '/:symbol/history',
  [param('symbol').isString().isLength({ min: 1, max: 12 })],
  validate,
  ctrl.history
);

module.exports = router;
