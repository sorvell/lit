/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import type {Constructor} from './base.js';

declare global {
  interface CustomElementRegistry {
    getName: (ctor: CustomElementConstructor) => string | null;
  }
}

export type DefineErrorCallback = (
  error: Error,
  tagName: string,
  ctor: CustomElementConstructor
) => void;

/**
 *
 * @param tagName The tag name of the custom element to define.
 * @param ctor The constructor of the custom element to define
 * @param onError An optional function which can handle a define exception
 * error. If provided, the exception is caught.
 * @param onError
 * @returns void
 */
export const define = (
  tagName: string,
  ctor: CustomElementConstructor,
  onError?: DefineErrorCallback
) => {
  if (customElements.getName?.(ctor) === tagName) {
    return;
  }
  try {
    customElements.define(tagName, ctor);
  } catch (error) {
    if (onError === undefined) {
      throw error;
    } else {
      onError?.(error as Error, tagName, ctor);
    }
  }
};

export const warn = (error: Error) => {
  console.warn(error);
};

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semVerRe =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Parses a version string into an object providing semver version info.
 * @param versionStr Version string to parse.
 * @returns An object with keys for the semver info matching `vesrion`, `major`,
 *  `minor`, `patch`, `prerelease`, and `buildmetadtata`.
 */
export const parseSemVer = (versionStr: string | undefined) => {
  if (versionStr === undefined) {
    return {};
  }
  const [version, major, minor, patch, prerelease, buildmetadata] =
    versionStr.match(semVerRe) ?? [];
  return {version, major, minor, patch, prerelease, buildmetadata};
};

export interface PackageVersion {
  package?: string;
  version?: string;
}

const UNKNOWN_PACKAGE = '<unknown package>';
const UNKNOWN_VERSION = '<unknown version>';

/**
 * A define error callback which compares static `package` and `version`
 * properties on the provided constructor against an already defined element
 * of the given name and issues a console warning if the package or version
 * is incompatible.
 * @param error Exception error generated by the provoking define call.
 * @param tagName The tag name provided in the provoking define call.
 * @param ctor The constructor provided in the provoking define call.
 * @returns
 */
export const warnPackageVersion = (
  _error: Error,
  tagName: string,
  ctor: CustomElementConstructor
) => {
  const {package: definedPackage, version: definedVersion} =
    (customElements.get(tagName) ?? {}) as PackageVersion;
  const {package: newPackage, version: newVersion} = ctor as PackageVersion;
  const packageOk = definedPackage === newPackage;
  let versionOk = definedVersion === newVersion;
  // versions match if using semver and "patch" is only diff.
  if (!versionOk) {
    const {major: definedMajor, minor: definedMinor} =
      parseSemVer(definedVersion);
    const {major: newMajor, minor: newMinor} = parseSemVer(newVersion);
    versionOk =
      newMajor !== undefined &&
      definedMajor === newMajor &&
      definedMinor === newMinor;
  }
  if (packageOk && versionOk) {
    return;
  }

  const definedInfo = `"${definedPackage ?? UNKNOWN_PACKAGE}@${
    definedVersion ?? UNKNOWN_VERSION
  }"`;
  const newInfo = `"${newPackage ?? UNKNOWN_PACKAGE}@${
    newVersion ?? UNKNOWN_VERSION
  }"`;

  console.warn(
    `Warning, failed to execute 'define' on 'CustomElementRegistry': ` +
      `the name "${name}" has already been defined as ${definedInfo} and ` +
      `cannot be re-defined as ${newInfo}`
  );
};

/**
 * Allow for custom element classes with private constructors
 */
type CustomElementClass = Omit<typeof HTMLElement, 'new'>;

export type CustomElementDecorator = {
  // legacy
  (cls: CustomElementClass): void;

  // standard
  (
    target: CustomElementClass,
    context: ClassDecoratorContext<Constructor<HTMLElement>>
  ): void;
};

/**
 * Class decorator factory that defines the decorated class as a custom element.
 *
 * ```js
 * @customElement('my-element')
 * class MyElement extends LitElement {
 *   render() {
 *     return html``;
 *   }
 * }
 * ```
 * @category Decorator
 * @param tagName The tag name of the custom element to define.
 * @param onError An optional function which can handle a define exception
 * error. If provided, the exception is caught.
 */
export const customElement =
  (tagName: string, onError?: DefineErrorCallback): CustomElementDecorator =>
  (
    classOrTarget: CustomElementClass | Constructor<HTMLElement>,
    context?: ClassDecoratorContext<Constructor<HTMLElement>>
  ) => {
    if (context !== undefined) {
      context.addInitializer(() => {
        customElements.define(
          tagName,
          classOrTarget as CustomElementConstructor
        );
      });
    } else {
      define(tagName, classOrTarget as CustomElementConstructor, onError);
    }
  };
