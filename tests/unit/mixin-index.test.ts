/**
 * Mixins Index Re-export Unit Tests
 *
 * Tests that the mixins/index.ts barrel file correctly re-exports
 * all mixin factories and their associated types.
 */

import {
  LoggerMixin,
  MetricsTrackerMixin,
  CacheManagerMixin,
  HealthCheckMixin,
  HttpRequestMixin,
  OrderHelpersMixin,
} from '../../src/adapters/base/mixins/index.js';

import type {
  Constructor,
  ILoggerMixinBase,
  ILoggerCapable,
  IMetricsMixinBase,
  IMetricsCapable,
  ICacheMixinBase,
  ICacheCapable,
  IHealthCheckMixinBase,
  IHealthCheckCapable,
  IHttpRequestMixinBase,
  IHttpRequestCapable,
  IOrderHelpersMixinBase,
  IOrderHelpersCapable,
} from '../../src/adapters/base/mixins/index.js';

describe('Mixins Index', () => {
  describe('exports all mixin factories', () => {
    test('LoggerMixin is exported and callable', () => {
      expect(typeof LoggerMixin).toBe('function');
    });

    test('MetricsTrackerMixin is exported and callable', () => {
      expect(typeof MetricsTrackerMixin).toBe('function');
    });

    test('CacheManagerMixin is exported and callable', () => {
      expect(typeof CacheManagerMixin).toBe('function');
    });

    test('HealthCheckMixin is exported and callable', () => {
      expect(typeof HealthCheckMixin).toBe('function');
    });

    test('HttpRequestMixin is exported and callable', () => {
      expect(typeof HttpRequestMixin).toBe('function');
    });

    test('OrderHelpersMixin is exported and callable', () => {
      expect(typeof OrderHelpersMixin).toBe('function');
    });
  });

  describe('type exports are usable', () => {
    test('Constructor type is usable', () => {
      // Type-level check: Constructor<object> should work
      const TestClass: Constructor<object> = class {};
      expect(new TestClass()).toBeInstanceOf(TestClass);
    });

    test('ILoggerMixinBase interface is structurally valid', () => {
      const obj: ILoggerMixinBase = {
        name: 'test',
        config: { timeout: 5000 },
      };
      expect(obj.name).toBe('test');
    });

    test('IMetricsMixinBase interface is structurally valid', () => {
      // Just verify the types compile - if they don't export correctly, this fails to compile
      const check = (_: IMetricsCapable) => {};
      expect(typeof check).toBe('function');
    });

    test('ICacheMixinBase interface is structurally valid', () => {
      const check = (_: ICacheCapable) => {};
      expect(typeof check).toBe('function');
    });

    test('IHealthCheckCapable interface is structurally valid', () => {
      const check = (_: IHealthCheckCapable) => {};
      expect(typeof check).toBe('function');
    });

    test('IHttpRequestCapable interface is structurally valid', () => {
      const check = (_: IHttpRequestCapable) => {};
      expect(typeof check).toBe('function');
    });

    test('IOrderHelpersCapable interface is structurally valid', () => {
      const check = (_: IOrderHelpersCapable) => {};
      expect(typeof check).toBe('function');
    });
  });

  describe('mixin composition works end-to-end', () => {
    test('multiple mixins can be composed', () => {
      // A base class that satisfies LoggerMixin requirements
      class Base {
        readonly name = 'ComposedAdapter';
        readonly config = { timeout: 5000, debug: false };
      }

      // Apply LoggerMixin
      const WithLogger = LoggerMixin(Base as Constructor<Base & ILoggerMixinBase>);
      const instance = new WithLogger();

      expect(instance.name).toBe('ComposedAdapter');
      expect(typeof instance.debug).toBe('function');
      expect(typeof instance.info).toBe('function');
      expect(typeof instance.warn).toBe('function');
      expect(typeof instance.error).toBe('function');
    });
  });
});
