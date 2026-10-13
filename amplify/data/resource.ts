import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { pinAuthorizer } from "../functions/pin-authorizer/resource";

const schema = a.schema({
  AccountStatus: a.enum(["ACTIVE", "CLOSED"]),
  PlanType: a.enum(["SINGLE", "PROMO"]),
  ClientStatus: a.enum(["ACTIVE", "CANCELLED"]),

  Account: a
    .model({
      alias: a.string().required(), // e.g. "Cuenta 1"
      spotifyEmail: a.email().required(),
      spotifyPassword: a.string().required(), // plain text, DynamoDB encryption at rest
      billingDay: a.integer().required(), // 1–31, Spotify charge day
      monthlyCost: a.integer().required(), // default 240
      status: a.ref("AccountStatus").required(),
      notes: a.string(),
      clients: a.hasMany("Client", "accountId"),
    })
    .authorization((allow) => [allow.custom()]),

  Client: a
    .model({
      accountId: a.id().required(),
      account: a.belongsTo("Account", "accountId"),
      name: a.string().required(),
      phone: a.string(),
      spotifyEmail: a.email(),
      notes: a.string(),
      startDate: a.date().required(), // YYYY-MM-DD
      paymentDay: a.integer().required(), // 1–31, default = day of startDate
      planType: a.ref("PlanType").required(),
      amount: a.integer().required(), // monthly, default from PRICES
      slots: a.integer().array().required(), // [n] for SINGLE, [n, m] for PROMO; values 1–5
      secondName: a.string(), // PROMO only
      secondSpotifyEmail: a.email(), // PROMO only
      status: a.ref("ClientStatus").required(),
      cancelledAt: a.date(),
      payments: a.hasMany("Payment", "clientId"),
    })
    .authorization((allow) => [allow.custom()]),

  Payment: a
    .model({
      clientId: a.id().required(),
      client: a.belongsTo("Client", "clientId"),
      period: a.string().required(), // "YYYY-MM"
      paidAt: a.date().required(),
      amount: a.integer().required(),
    })
    .authorization((allow) => [allow.custom()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "lambda",
    lambdaAuthorizationMode: {
      function: pinAuthorizer,
      // Short cache so a rotated PIN takes effect quickly.
      timeToLiveInSeconds: 60,
    },
  },
});
