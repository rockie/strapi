'use strict';

// Dependencies.
const glob = require('glob');
const path = require('path');
const utils = require('../utils');
const { parallel } = require('async');
const { setWith, last, upperFirst, lowerFirst } = require('lodash');

module.exports = function() {
  this.middlewares = {};
  this.koaMiddlewares = {};

  return Promise.all([
    new Promise((resolve, reject) => {
      glob(
        './node_modules/koa-*',
        {
          cwd: path.resolve(__dirname, '..', '..')
        },
        (err, files) => {
          if (err) {
            return reject(err);
          }

          parallel(
            files.map(p => cb => {
              const extractStr = p
                .split('/')
                .pop()
                .replace(/^koa(-|\.)/, '')
                .split('-');

              const name = lowerFirst(
                extractStr.length === 1
                  ? extractStr[0]
                  : extractStr.map(p => upperFirst(p)).join('')
              );

              // Lazy loading.
              Object.defineProperty(this.koaMiddlewares, name, {
                configurable: false,
                enumerable: true,
                get: () => require(path.resolve(__dirname, '..', '..', p))
              });

              cb();
            }),
            err => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        }
      );
    }),
    new Promise((resolve, reject) => {
      glob(
        './*/',
        {
          cwd: path.resolve(__dirname, '..', 'middlewares')
        },
        (err, files) => {
          if (err) {
            return reject(err);
          }

          parallel(
            files.map(p => cb => {
              const name = p.split('/')[1];

              this.middlewares[name] = {
                loaded: false
              };

              // Lazy loading.
              Object.defineProperty(this.middlewares[name], 'load', {
                configurable: false,
                enumerable: true,
                get: () => require(path.resolve(__dirname, '..', 'middlewares', p))(this)
              });

              cb();
            }),
            err => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        }
      );
    })
  ]);
};
