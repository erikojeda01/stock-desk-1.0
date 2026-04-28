'use strict';

const router = require('express').Router();
const { body } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/user.controller');

router.get('/me', authRequired, ctrl.getMe);

router.patch(
  '/me',
  authRequired,
  [
    body('name').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('avatarUrl').optional().isString().isLength({ max: 500 }),
    body('baseCurrency').optional().isString().isLength({ min: 3, max: 3 }),
  ],
  validate,
  ctrl.updateMe
);

router.delete('/me', authRequired, ctrl.deleteMe);

module.exports = router;
