// React stub for Node builds
// Provides no-op implementations for runtime use

const noop = () => null;
const identity = (x) => x;

// React internals
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  ReactCurrentOwner: { current: null },
  ReactCurrentDispatcher: { current: null },
  ReactCurrentBatchConfig: { transition: null },
};

// Components
export const Fragment = ({ children }) => children;
export const StrictMode = ({ children }) => children;
export const Suspense = ({ children }) => children;
export const Profiler = ({ children }) => children;

// Component classes
export class Component {
  constructor(props) { this.props = props; this.state = {}; }
  setState() {}
  forceUpdate() {}
  render() { return null; }
}
export class PureComponent extends Component {}

// Core functions
export const createElement = (type, props, ...children) => ({ type, props: { ...props, children } });
export const cloneElement = (el, props, ...children) => ({ ...el, props: { ...el?.props, ...props, children } });
export const createContext = (defaultValue) => ({
  Provider: ({ children }) => children,
  Consumer: ({ children }) => children?.(defaultValue) ?? null,
  _currentValue: defaultValue,
});
export const createRef = () => ({ current: null });
export const forwardRef = (render) => render;
export const memo = (component) => component;
export const lazy = (factory) => (props) => null;
export const isValidElement = () => false;

// Hooks
export const useState = (init) => [typeof init === 'function' ? init() : init, noop];
export const useEffect = noop;
export const useLayoutEffect = noop;
export const useInsertionEffect = noop;
export const useCallback = identity;
export const useMemo = (fn) => fn();
export const useRef = (init) => ({ current: init });
export const useContext = (ctx) => ctx._currentValue;
export const useReducer = (reducer, init, initFn) => [initFn ? initFn(init) : init, noop];
export const useImperativeHandle = noop;
export const useDebugValue = noop;
export const useDeferredValue = identity;
export const useTransition = () => [false, (fn) => fn()];
export const useId = () => ':r0:';
export const useSyncExternalStore = (sub, getSnap) => getSnap();

// Misc
export const startTransition = (fn) => fn();
export const Children = {
  map: (c, fn) => c ? [].concat(c).map(fn) : [],
  forEach: (c, fn) => c && [].concat(c).forEach(fn),
  count: (c) => c ? [].concat(c).length : 0,
  only: (c) => c,
  toArray: (c) => c ? [].concat(c) : [],
};

export const version = '18.2.0';

export default {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  Fragment, StrictMode, Suspense, Profiler,
  Component, PureComponent,
  createElement, cloneElement, createContext, createRef, forwardRef, memo, lazy, isValidElement,
  useState, useEffect, useLayoutEffect, useInsertionEffect, useCallback, useMemo, useRef,
  useContext, useReducer, useImperativeHandle, useDebugValue, useDeferredValue, useTransition, useId, useSyncExternalStore,
  startTransition, Children, version,
};
