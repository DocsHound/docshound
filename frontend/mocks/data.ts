import {
  DocType,
  Provider,
  SearchResult,
  TextType,
} from 'generated/graphql_types';

export const workspace = {
  name: 'DocsHound',
  desc: 'The open source workplace search and work hub.',
  favicon: '/favicon.ico',
};

export const user = {
  firstName: 'Richard',
  lastName: 'Wu',
  avatar: 'https://bit.ly/kent-c-dodds',
};

const results: Array<SearchResult> = [
  {
    __typename: 'Document',
    provider: Provider.Confluence,
    docType: DocType.WebPage,
    title: 'RFC: Centering a div',
    desc: {
      text: 'This is an rfc for centering divs ... Centering a div is rather difficult because of the complexities of CSS ... Every div matters',
      type: TextType.Markdown,
    },
    url: 'https://docs.google.com/',
    lastUpdated: new Date().getTime() - 1000 * 60 * 32,
    created: new Date().getTime() - 1000 * 60 * 32,
    authors: [
      { resourceID: '123', resourceName: 'Richard Wu', resourceURL: null },
    ],
  },
  {
    __typename: 'Document',
    provider: Provider.Confluence,
    docType: DocType.WebPage,
    title: 'Tutorial on Centering Divs',
    desc: {
      text: 'Centering divs are quite difficult: that is why we wrote this 20-minute tutorial on how to center a div.',
      type: TextType.Markdown,
    },
    url: 'https://confluence.atlassian.com/',
    lastUpdated: new Date().getTime() - 1000 * 60 * 60 * 24 * 9,
    created: new Date().getTime() - 1000 * 60 * 32,
    authors: [
      { resourceID: '123', resourceName: 'Richard Wu', resourceURL: null },
    ],
  },
];
