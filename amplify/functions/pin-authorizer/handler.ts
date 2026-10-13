import type { AppSyncAuthorizerHandler } from "aws-lambda";
import { env } from "$amplify/env/pin-authorizer";

// Never log the token: it is the admin PIN.
export const handler: AppSyncAuthorizerHandler = async (event) => {
  return {
    isAuthorized: event.authorizationToken === env.ACCESS_PIN,
  };
};
