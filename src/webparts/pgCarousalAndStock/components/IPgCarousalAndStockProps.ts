import { SPHttpClient } from '@microsoft/sp-http';
import { PageContext } from '@microsoft/sp-page-context';
export interface IPgCarousalAndStockProps {
  description: string;
  spHttpClient: SPHttpClient;
  siteUrl: string;
  pgContext: PageContext;
  httpClient:any;
  webpartProps:any;
  context:any;
}

