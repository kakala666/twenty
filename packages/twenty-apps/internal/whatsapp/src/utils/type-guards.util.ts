// Local stand-ins for `twenty-shared/utils` and `@sniptt/guards`: an installed
// app bundles its own dependencies, and neither package is a dependency here.

export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;
