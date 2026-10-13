import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { pinAuthorizer } from './functions/pin-authorizer/resource';

defineBackend({
  data,
  pinAuthorizer,
});
