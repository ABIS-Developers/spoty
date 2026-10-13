import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

export type DataClient = ReturnType<typeof generateClient<Schema>>;

let client: DataClient | null = null;

/** Builds the Data client that sends `token` to the AppSync Lambda authorizer. */
export function configureDataClient(token: string): DataClient {
  client = generateClient<Schema>({ authMode: "lambda", authToken: token });
  return client;
}

export function clearDataClient(): void {
  client = null;
}

export function getDataClient(): DataClient {
  if (!client) {
    throw new Error("Data client is not configured. Log in first.");
  }
  return client;
}

/** True when a GraphQL error list or thrown error comes from the authorizer rejecting the token. */
export function isUnauthorizedError(error: unknown): boolean {
  const errors = Array.isArray(error) ? error : [error];
  return errors.some((item) => {
    if (!item || typeof item !== "object") return false;
    const { errorType, message } = item as { errorType?: unknown; message?: unknown };
    return [errorType, message].some(
      (value) => typeof value === "string" && /unauthori[sz]ed|not authorized/i.test(value),
    );
  });
}

type GraphQLErrorLike = { message?: string };

/** Throws when an Amplify Data call returned GraphQL errors. */
export function throwIfErrors(errors: ReadonlyArray<GraphQLErrorLike> | undefined): void {
  if (errors?.length) {
    throw Object.assign(new Error(errors.map((error) => error.message).join("; ")), { errors });
  }
}

type Page<T> = {
  data: T[];
  nextToken?: string | null;
  errors?: ReadonlyArray<GraphQLErrorLike>;
};

/** Follows `nextToken` until every page of a list query is loaded. */
export async function listAll<T>(fetchPage: (nextToken: string | null) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null = null;
  do {
    const page: Page<T> = await fetchPage(nextToken);
    throwIfErrors(page.errors);
    items.push(...page.data);
    nextToken = page.nextToken ?? null;
  } while (nextToken);
  return items;
}
