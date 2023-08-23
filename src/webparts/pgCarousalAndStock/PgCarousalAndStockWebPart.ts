import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'PgCarousalAndStockWebPartStrings';
import PgCarousalAndStock from './components/PgCarousalAndStock';
import { IPgCarousalAndStockProps } from './components/IPgCarousalAndStockProps';
import * as $ from 'jquery';
require("jquery.marquee");
export interface IPgCarousalAndStockWebPartProps {
  description: string;
  RefreshIntervalForNews:number;
  RefreshIntervalForStock:number;
}
 
export default class PgCarousalAndStockWebPart extends BaseClientSideWebPart <IPgCarousalAndStockWebPartProps> {

  
  public render(): void {
    
    const element: React.ReactElement<IPgCarousalAndStockProps> = React.createElement(
      PgCarousalAndStock,
      {
        description: this.properties.description,
        spHttpClient: this.context.spHttpClient,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        pgContext:this.context.pageContext,
        httpClient:this.context.httpClient,
        webpartProps:this.properties,
        context:this.context
        
      }
    );
   
    ReactDom.render(element, this.domElement);
    const currentCanvasZone=document.querySelector(".CanvasZoneContainer, .CarousalStockContainer");
    currentCanvasZone.classList.add("CarousalStockContainerBG");
    
   
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
 
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: ""
          },
          groups: [
            {
              groupName: "Refresh cache configuration in minutes",
              groupFields: [
                PropertyPaneSlider('RefreshIntervalForNews', {
                  label: 'News refresh interval',
                  min:1,
                  max:30,
                  value:15,
                  showValue:true,
                }),
                PropertyPaneSlider('RefreshIntervalForStock', {
                  label: 'Stock refresh interval',
                  min:1,
                  max:30,
                  value:10,
                  showValue:true,
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
