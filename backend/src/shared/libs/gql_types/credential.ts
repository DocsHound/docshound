import { Prisma } from '@prisma/client';
import { Field, InputType, ObjectType } from 'type-graphql';
import * as GraphQLScalars from 'graphql-scalars';
import { GlobalCredentialKey, Provider } from './integration';

@InputType()
export class GlobalCredentialInputKV {
  @Field((_type) => GlobalCredentialKey)
  key!: GlobalCredentialKey;

  @Field((_type) => String, { nullable: true })
  value!: string | null;
}

@ObjectType()
export class GlobalCredentialOutputKV {
  @Field((_type) => GlobalCredentialKey)
  key!: GlobalCredentialKey;

  @Field((_type) => String, { nullable: true })
  value!: string | null;
}

@ObjectType()
export class DecryptedGlobalApiCredential {
  @Field((_type) => Provider)
  provider!: Provider;

  @Field((_type) => Boolean)
  exists!: boolean;

  @Field((_type) => [GlobalCredentialOutputKV])
  data!: Array<GlobalCredentialOutputKV>;
}

@ObjectType()
export class DecryptedUserApiCredential {
  @Field((_type) => String)
  userId!: string;

  @Field((_type) => Provider)
  provider!: Provider;

  // See https://api.slack.com/methods/oauth.v2.access for schema of a valid object.
  @Field((_type) => GraphQLScalars.JSONObjectResolver)
  credentialsJSON!: Prisma.JsonObject;
}
