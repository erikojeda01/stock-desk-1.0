'use strict';

const router = require('express').Router();
const { body } = require('express-validator');

const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 1, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 128 }),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 1 }),
  ],
  validate,
  ctrl.login
);

router.post(
  '/refresh',
  [body('refreshToken').isString().notEmpty()],
  validate,
  ctrl.refresh
);

router.get('/me', authRequired, ctrl.me);

router.post(
  '/change-password',
  authRequired,
  [
    body('currentPassword').isString().notEmpty(),
    body('newPassword').isString().isLength({ min: 8, max: 128 }),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
