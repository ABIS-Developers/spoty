import { defineFunction, secret } from "@aws-amplify/backend";

export const pinAuthorizer = defineFunction({
  name: "pin-authorizer",
  environment: {
    ACCESS_PIN: secret("ACCESS_PIN"),
  },
});
