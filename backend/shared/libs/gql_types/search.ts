import {
  createUnionType,
  Field,
  ObjectType,
  registerEnumType,
  GraphQLTimestamp,
  InputType,
} from 'type-graphql';
import { Provider } from './integration';

export enum DocType {
  WebPage = 'WEB_PAGE',
  Doc = 'DOC',
  Slide = 'SLIDE',
  File = 'FILE',
}

registerEnumType(DocType, {
  name: 'DocType',
  description:
    'If applicable, specifies the type of the document within the provider (e.g., "DOC" for Google Docs, "SLIDE" for Google Slides, "FILE" for Slack files).',
});

@InputType({ description: 'provider + doc type (if applicable) to filter by' })
export class ProviderDocType {
  @Field((_type) => Provider)
  provider!: Provider;

  @Field((_type) => DocType, { nullable: true })
  docType!: DocType | null;
}

@ObjectType()
class ProviderResource {
  @Field((_type) => String)
  resourceID!: string;

  @Field((_type) => String, { nullable: true })
  resourceName!: string | null;

  @Field((_type) => String, { nullable: true })
  resourceURL!: string | null;
}

export enum TextType {
  Raw = 'RAW',
  Markdown = 'MARKDOWN',
}

registerEnumType(TextType, {
  name: 'TextType',
  description: 'How to render the given text.',
});

@ObjectType()
class SearchResultText {
  @Field((_type) => String)
  text!: string;

  @Field((_type) => TextType)
  type!: TextType;
}

@ObjectType()
export class Document {
  @Field((_type) => Provider)
  provider!: Provider;
  @Field((_type) => DocType, { nullable: true })
  docType!: DocType | null;

  @Field((_type) => String, { nullable: true })
  title!: string | null;

  @Field((_type) => SearchResultText, { nullable: true })
  desc!: SearchResultText | null;

  @Field((_type) => String, { nullable: true })
  url!: string | null;

  @Field((_type) => [ProviderResource])
  authors!: Array<ProviderResource>;

  @Field((_type) => GraphQLTimestamp, { nullable: true })
  lastUpdated!: Date | null;

  @Field((_type) => GraphQLTimestamp, { nullable: true })
  created!: Date | null;
}

@ObjectType()
export class Message {
  @Field((_type) => Provider)
  provider!: Provider;

  @Field((_type) => ProviderResource, { nullable: true })
  group!: ProviderResource | null;

  @Field((_type) => SearchResultText, { nullable: true })
  message!: SearchResultText | null;

  @Field((_type) => String, { nullable: true })
  url!: string | null;

  @Field((_type) => ProviderResource, { nullable: true })
  author!: ProviderResource | null;

  @Field((_type) => String, { nullable: true })
  avatar!: string | null;

  @Field((_type) => GraphQLTimestamp, { nullable: true })
  created!: Date | null;
}

export const SearchResult = createUnionType({
  name: 'SearchResult',
  types: () => [Document, Message] as const,
  resolveType: (value) => {
    if ('message' in value) return Message;
    if ('desc' in value) return Document;
    return undefined;
  },
});
