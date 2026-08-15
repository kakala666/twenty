import { isNonEmptyString } from 'src/utils/type-guards.util';

// How a logic function reads the values declared in `serverVariables`.
//
// The server's logic-function executor decrypts every declared server variable
// and merges it straight into the sandbox environment as its own key
// (`envMap[variable.key] = plaintextValue`), so `process.env.WAHA_BASE_URL` is
// the real transport. The only accessor the SDK ships, `getApplicationVariable`
// from `twenty-sdk/front-component`, is a *front-component* helper: it parses a
// `process.env.applicationVariables` JSON blob that the front-component
// resolver sets and the function runtime does not. We therefore try that blob
// first — so a future runtime that adopts it wins — and fall back to the plain
// environment variable, which is what actually works today.
//
// Values are never logged: callers receive them and pass them to the WAHA
// client, which puts the key in a header only.
const readFromApplicationVariablesBlob = (key: string): string | undefined => {
  const raw = process.env.applicationVariables;

  if (!isNonEmptyString(raw)) {
    return undefined;
  }

  try {
    const variables = JSON.parse(raw) as Record<string, unknown>;
    const value = variables[key];

    return isNonEmptyString(value) ? value : undefined;
  } catch {
    // A malformed blob must not take the whole function down; the plain
    // environment variable is still a valid source.
    return undefined;
  }
};

export const readApplicationVariable = (key: string): string | undefined =>
  readFromApplicationVariablesBlob(key) ??
  (isNonEmptyString(process.env[key]) ? process.env[key] : undefined);

export const requireApplicationVariable = (key: string): string => {
  const value = readApplicationVariable(key);

  if (!isNonEmptyString(value)) {
    throw new Error(
      `[whatsapp] Missing required application variable "${key}". ` +
        'Set it on the app installation or in the server environment.',
    );
  }

  return value;
};
