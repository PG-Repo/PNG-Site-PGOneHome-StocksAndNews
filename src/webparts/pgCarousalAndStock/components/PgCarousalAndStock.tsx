import * as React from 'react';
import styles from './PgCarousalAndStock.module.scss';
import { IPgCarousalAndStockProps } from './IPgCarousalAndStockProps';
import { escape, isEmpty, trimStart } from '@microsoft/sp-lodash-subset';
import Carousel from "react-multi-carousel";

import "react-multi-carousel/lib/styles.css";
import { stringIsNullOrEmpty } from '@pnp/common';
import { ErrorLogging } from "./ErrorLogging/ErrorLogging";
import { PnPHelper } from './PnpHelper/PnpHelper';
require('./style.css');
import * as $ from 'jquery';
require("jquery.marquee");
require("marquee");
import { ga, initialize, pageview } from 'react-ga';

//require('feedEk'); 



import { SPHttpClient, SPHttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';
interface IListItem {
  Title?: string;
  Id: number;
  PGCarouselImage: {
    Url: string
  };
  ExternalLink: {
    Url: string
  };
  PGLocation: string;
}

interface IBreakingNews {
  Title: string;
  Description: HTMLBaseElement;
  BgColor: string;
  ContentFontColor: string;
  TitleFontColor: string;
  ExpiryDate: string;
  ContentScrollSpeed: any;
  Animation: any;
}


interface IPgCarousalAndStockState {
  status: string;
  items: IListItem[];
  stockPrice: string;
  stockMovementClass: any;
  stockMovement: any;
  stockTimestamp: any;
  chacheExpiryTimeForNews?: number;
  chacheExpiryTimeForStock?: number;
  breakingNews?: any;
  chacheExpiryTimeForBreakingNews?: number;
  showBreakingNews: boolean;
  ConfigMasterMasterItems?: any[];
  DailyNewsUrl?: string;
  StockNewsURL?: string;
  StockNewsRedirectUrl: string;
  CountryName: string;
}

let parentObj = this;
export default class PgCarousalAndStock extends React.Component<IPgCarousalAndStockProps, IPgCarousalAndStockState>
{
  private pnpHelper: PnPHelper;
  private errorLogging: ErrorLogging;
  private configMaster = [];
  private errTitle: string = "PNG-Site-PGOneHome-StocksAndNews";
  private errModule: string = "PgCarousalAndStock.tsx";

  constructor(props: IPgCarousalAndStockProps, state: IPgCarousalAndStockState) {

    super(props);
    this.state = {
      status: "loading started",
      items: [],
      stockPrice: "",
      stockMovementClass: "",
      stockMovement: "",
      stockTimestamp: "",
      StockNewsRedirectUrl: "",

      //chacheExpiryTimeForNews: 2,
      chacheExpiryTimeForStock: 0,
      chacheExpiryTimeForBreakingNews: 3,

      showBreakingNews: false,
      breakingNews: [],
      CountryName: ""
    };
    this.pnpHelper = new PnPHelper(this.props.context);
    this.errorLogging = new ErrorLogging(this.props.context);

    //this.setState({
    //  breakingNews:{description:"asd"}
    //});


    {
      //console.log(this.props.pgContext.user);
      //console.log(this.props)
      //console.log(this.props.webpartProps.RefreshIntervalForNews)
    }


  }



 

  public componentWillMount() {
    //Google Analytics
    try {
      Promise.all([
        this.pnpHelper.getConfigMasterListItems(), this.pnpHelper.userProfileDetails()

      ]).then(([configMasterItems, userProfile]) => {
        if (configMasterItems['GoogleAnalyticsTrackingId'] != undefined) {
          let trackingID: string = configMasterItems['GoogleAnalyticsTrackingId'];
          initialize(trackingID);

          // let user_email: string = this.context.pageContext.user.loginName;
          let user_id: string = "*";
          let userHostCountry: string = "*";
          try {
            userProfile['TNumber'];
            var countryName = userProfile['Country'].toLocaleLowerCase().trim();

            var filterCountry = getCountryCode(countryName);
            if (filterCountry.length > 0) {
              userHostCountry = getCountryCode(countryName)[0]['CC'];
            }
          } catch (ex) { }


          //  ga('set', 'dimension1', userFunction);
          //  ga('set', 'dimension2', userOrgType);
          ga('set', 'dimension3', userProfile['OrganizationName']);//userOrgName
          ga('set', 'dimension4', userProfile['CostCenter']);//userCostCenter
          ga('set', 'dimension5', userHostCountry);
          ga('set', 'dimension6', userProfile['EmployeeType']);//userEEType
          //  ga('set', 'dimension7', newUser); //true or false
          ga('send', {
            'hitType': 'pageview',
            'page': window.location.pathname + window.location.search, //active page
            //'title': 'PGOne Home - Dev',

          });


          //pageview(window.location.pathname + window.location.search,);

        } else {
          //Log.info(LOG_SOURCE, "Tracking ID not provided");
        }
      });
    }
    catch (error) {
      this.errorLogging.logError(this.errTitle, this.errModule, "", error, "componentDidMount");
      // console.log(e);
    }

    try {
      Promise.all([
        this.pnpHelper.getConfigMasterListItems(),
        this.pnpHelper.userProfileDetails()
      ]).then(([configDetails, userProfile]) => {
        

        //console.log(userProfile);
        //console.log(userProfile['Country']);

        this.setState({
          ConfigMasterMasterItems: configDetails,
          CountryName: userProfile['Country'] == undefined ? "" : userProfile['Country']
        });

        this.setState({
          chacheExpiryTimeForStock: parseInt(this.state.ConfigMasterMasterItems["StockTickerCacheExpiry"]),
          chacheExpiryTimeForNews: parseInt(this.state.ConfigMasterMasterItems["DailyNewsCacheExpiry"]),
          DailyNewsUrl: this.state.ConfigMasterMasterItems["DailyNewsUrl"],
          StockNewsURL: this.state.ConfigMasterMasterItems["StockNewsUrl"],
          StockNewsRedirectUrl: this.state.ConfigMasterMasterItems["StockNewsRedirectUrl"],
        });

        //console.log("Config Master - chacheExpiryTimeForStock:-" + this.state.chacheExpiryTimeForStock);
        //console.log("Config Master - chacheExpiryTimeForNews:-" + this.state.chacheExpiryTimeForNews);

        //checking the local storage for News
        var itemsNews = this.getLocalStorage("News");
        if (itemsNews) {
          //console.log('%c%s', 'color: green;', "PGNews - Items found in local storage");
          //console.log(JSON.parse(itemsNews));
          this.setState({
            status: `Successfully loaded from local storage`,
            items: JSON.parse(itemsNews)
          });
          //console.log(JSON.parse(itemsNews))
        } else {
          // console.log('%c%s', 'color: yellow;background:black', "PGNews - Items not found in local storage, will retrieve from SharePoint");
          this.getPGNews();
        }



        //checking the local storage for Stock
        
        var itemsStock = this.getLocalStorage("Stock");
        if (itemsStock) {
          //console.log('%c%s', 'color: green;', "PGOne Stock - Items found in local storage");
          //console.log(JSON.parse(itemsStock));
          $('#divRss').hide();
          this.setState({
            status: `Successfully loaded from local storage`,
            stockPrice: JSON.parse(itemsStock).stockPrice,
            stockMovementClass: JSON.parse(itemsStock).stockMovementClass,
            stockMovement: JSON.parse(itemsStock).stockMovement,
            stockTimestamp: JSON.parse(itemsStock).stockTimestamp
          });
          //console.log(this.state.StockNewsRedirectUrl);
          $('#stockContainer').click(function () {
            ga('send', {
              'hitType': 'event', // Required.
              'eventCategory': 'Stock', // Required.
              'eventAction': 'Stock click', // Required.
              'eventLabel': 'Stock click',
              'eventValue': 1
            });
            var win = window.open($('#stockContainer').attr('StockNewsRedirectUrl'), '_blank');
            win.focus();
          });
          $("#stockContainer").keyup(function(event) {
            if (event.key === "Enter") {
                $("#stockContainer").click();
            }
        });

        } else {
          $('#divRss').hide();
          //console.log('%c%s', 'color: yellow;background:black', "PGOne Stock - Items not found in local storage, will retrieve from RSS Feed");
          //this.getRssFeed(parseInt(configDetails['StockTickerCacheExpiry']));
          this.getStockNews();
        }
        // this.getStockNews();
        
        //checking the local storage for Breaking news
        this.getBreakingNews();
      });



    }//try end
    catch (error) {
      //console.log(e);
      this.errorLogging.logError(this.errTitle, this.errModule, "", error, "componentDidMount");
    }



    

  }


  public render(): React.ReactElement<IPgCarousalAndStockProps> {
    const itemsCarousal: JSX.Element[] = this.state.items.map((item: IListItem, i: number): JSX.Element => {
      try {
        return (
          //<div >{item.Title} ({item.Id}) </div>
          <div className='PGCarousalItem' onClick={() => this.openInNewTab(item.Title, item.ExternalLink.Url)}>
            
            <a href="#" className={item.ExternalLink==null?"non-Pointer":""} >
            {/* alt={`Image - `+item.Title} */}
              <img alt="" className='PGCarousalImg'
                src={item.PGCarouselImage==null?"":item.PGCarouselImage.Url}
 
              />
              <div className='PGCarousalCaption'>{item.Title}</div>
            </a>
          </div>
        );
       
      } catch (error) {
        //this.errorLogging.logError(this.errTitle, this.errModule, "", error, "render");
      }
    });
    const responsive = {
      desktopXXL: {
        breakpoint: { max: 3000, min: 1920 },
        items: 8,
        slidesToSlide: 1 // optional, default to 1.
      },
      desktopXL: {
        breakpoint: { max: 1920, min: 1501 },
        items: 6,
        slidesToSlide: 1 // optional, default to 1.
      },
      desktop: {
        breakpoint: { max: 1500, min: 1025 },
        items: 5,
        slidesToSlide: 1 // optional, default to 1.
      },
      tabletXL: {
        breakpoint: { max: 1024, min: 769 },
        items: 3,
        slidesToSlide: 1 // optional, default to 1.
      },
      tablet: {
        breakpoint: { max: 768, min: 465 },
        items: 2,
        slidesToSlide: 1 // optional, default to 1.
      },
      mobile: {
        breakpoint: { max: 464, min: 0 },
        items: 2,
        slidesToSlide: 1 // optional, default to 1.
      }
    };

 

    return (
      <div>
        <div className="ms-Grid CarousalStockContainer CarousalStockContainerBG" >
          <div className="ms-Grid-row">
            <div className="ms-Grid-col ms-sm12 ms-md9 ms-lg10">
              <Carousel responsive={responsive} arrows={true}
                infinite
                itemClass="liCarousal"
                slidesToSlide={1}
                swipeable={true}
                draggable={true}
                beforeChange={(nextSlide, currentSlide) => {
                  {
                    currentSlide.currentSlide < nextSlide
                      ? this.newsScrollClick("Next") : this.newsScrollClick("Previous");
                  }
                }}
              >
                {itemsCarousal}
              </Carousel>
            </div>
            <div className="ms-Grid-col ms-sm12 ms-md3 ms-lg2 stockContainerCol">

              <div role="link" tabIndex={0}  id="stockContainer" {...{ "StockNewsRedirectUrl": this.state.StockNewsRedirectUrl }}>
                <div id="stockSymbolAndPrice">
                  <span id="stockSymbol">PG</span> <span id="stockPrice">
                    {this.state.stockPrice}</span>
                </div>
                <div id="stockMovement" className={this.state.stockMovementClass}>{this.state.stockMovement}</div>
                <div id="stockTimestamp">{this.state.stockTimestamp}</div>

              </div>
              <div id="divRss"></div>
            </div>
          </div>


        </div>


        {this.state.showBreakingNews && (
          <div className="ms-Grid pgBreakingNewsGrid">
            <div className="ms-Grid-row">
              <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg12 breakingNewsCol" style={{ backgroundColor: this.state.breakingNews.BgColor }}>
                <span className="breakingNews ms-hiddenLgDown" style={{ color: this.state.breakingNews.TitleFontColor }}>{this.state.breakingNews.Title}</span>
                <i className="ms-Icon ms-Icon--Megaphone ms-hiddenXlUp" aria-hidden="true" style={{ color: this.state.breakingNews.TitleFontColor }}></i>

                {/* <span id="marqueeSpan" style={{ color: this.state.breakingNews.ContentFontColor }} dangerouslySetInnerHTML={this.creatMarqueeHtmlElement(this.state.breakingNews.Description, this.state.breakingNews.ContentScrollSpeed)}></span> */}

                {/* <div className="marqueeDiv" style={{ animation: this.state.breakingNews.Animation, color: this.state.breakingNews.ContentFontColor }} dangerouslySetInnerHTML={{ __html: this.state.breakingNews.Description }} /> */}

                <div id="marqueeSpan"  {...{"ScrollTime":this.state.breakingNews.ContentScrollSpeed}} className="marquee" style={{ color: this.state.breakingNews.ContentFontColor }} 
                dangerouslySetInnerHTML={
                  { __html:
                  this.state.breakingNews.Description.replace("<a", "<a data-interception='off' ")
                   }}>
                  </div>

                <i onClick={() => this.hideBreakingNews()} className="speedContoll ms-Icon ms-Icon--ChromeClose" aria-hidden="true" title="Close" style={{ color: this.state.breakingNews.TitleFontColor }}></i>
              </div>

            </div>
          </div>

        )}

      </div>

    );


  }
  public creatMarqueeHtmlElement(content: string, scrollamount: number) {
    return { __html: '<marquee  scrollamount="' + scrollamount + '">' + content + '</marquee>' };
  }

  public openInNewTab(name: string, arg0: string): void {
    try{
      this.newsItemClick(name, arg0);
    
      window.open(decodeURI(arg0), "_blank");
    }catch(error){
      this.errorLogging.logError(this.errTitle, this.errModule, "Open New in new Tab click", error, "openInNewTab");
    }
    
  }

  private async getPGNews(): Promise<void> {
    var countryWithCode = [
      {
        OFC: "algeria",
        CC: "DZ"
      }, {
        OFC: "argentina",
        CC: "AR"
      }, {
        OFC: "australia",
        CC: "AU"
      }, {
        OFC: "austria",
        CC: "AT"
      }, {
        OFC: "azerbaijan",
        CC: "AZ"
      }, {
        OFC: "bangladesh",
        CC: "BD"
      }, {
        OFC: "belgium",
        CC: "BE"
      }, {
        OFC: "brazil",
        CC: "BR"
      }, {
        OFC: "bulgaria",
        CC: "BG"
      }, {
        OFC: "canada",
        CC: "CA"
      }, {
        OFC: "chile",
        CC: "CL"
      }, {
        OFC: "china",
        CC: "CN"
      }, {
        OFC: "colombia",
        CC: "CO"
      }, {
        OFC: "costa rica",
        CC: "CR"
      }, {
        OFC: "croatia",
        CC: "HR"
      }, {
        OFC: "czech republic",
        CC: "CZ"
      }, {
        OFC: "denmark",
        CC: "DK"
      }, {
        OFC: "dominican rep.",
        CC: "DO"
      }, {
        OFC: "egypt",
        CC: "EG"
      }, {
        OFC: "finland",
        CC: "FI"
      }, {
        OFC: "france",
        CC: "FR"
      }, {
        OFC: "germany",
        CC: "DE"
      }, {
        OFC: "greece",
        CC: "GR"
      }, {
        OFC: "guatemala",
        CC: "GT"
      }, {
        OFC: "hong kong",
        CC: "HK"
      }, {
        OFC: "hungary",
        CC: "HU"
      }, {
        OFC: "india",
        CC: "IN"
      }, {
        OFC: "indonesia",
        CC: "ID"
      }, {
        OFC: "ireland",
        CC: "IE"
      }, {
        OFC: "israel",
        CC: "IL"
      }, {
        OFC: "italy",
        CC: "IT"
      }, {
        OFC: "japan",
        CC: "JP"
      }, {
        OFC: "kazakhstan",
        CC: "KZ"
      }, {
        OFC: "kenya",
        CC: "KE"
      }, {
        OFC: "latvia",
        CC: "LV"
      }, {
        OFC: "luxembourg",
        CC: "LU"
      }, {
        OFC: "malaysia",
        CC: "MY"
      }, {
        OFC: "mexico",
        CC: "MX"
      }, {
        OFC: "morocco",
        CC: "MA"
      }, {
        OFC: "netherlands",
        CC: "NL"
      }, {
        OFC: "new zealand",
        CC: "NZ"
      }, {
        OFC: "nigeria",
        CC: "NG"
      }, {
        OFC: "norway",
        CC: "NO"
      }, {
        OFC: "pakistan",
        CC: "PK"
      }, {
        OFC: "panama",
        CC: "PA"
      }, {
        OFC: "peru",
        CC: "PE"
      }, {
        OFC: "philippines",
        CC: "PH"
      }, {
        OFC: "poland",
        CC: "PL"
      }, {
        OFC: "portugal",
        CC: "PT"
      }, {
        OFC: "puerto rico",
        CC: "PR"
      }, {
        OFC: "romania",
        CC: "RO"
      }, {
        OFC: "russia",
        CC: "RU"
      }, {
        OFC: "russian fed.",
        CC: "RU"
      }, {
        OFC: "saudi arabia",
        CC: "SA"
      }, {
        OFC: "serbia",
        CC: "RS"
      }, {
        OFC: "singapore",
        CC: "SG"
      }, {
        OFC: "slovakia",
        CC: "SK"
      }, {
        OFC: "south africa",
        CC: "ZA"
      }, {
        OFC: "south korea",
        CC: "KR"
      }, {
        OFC: "spain",
        CC: "ES"
      }, {
        OFC: "sri lanka",
        CC: "LK"
      }, {
        OFC: "sweden",
        CC: "SE"
      }, {
        OFC: "switzerland",
        CC: "CH"
      }, {
        OFC: "taiwan",
        CC: "TW"
      }, {
        OFC: "thailand",
        CC: "TH"
      }, {
        OFC: "turkey",
        CC: "TR"
      }, {
        OFC: "uk",
        CC: "UK"
      }, {
        OFC: "ukraine",
        CC: "UA"
      }, {
        OFC: "united arab emir",
        CC: "AE"
      }, {
        OFC: "united kingdom",
        CC: "UK"
      }, {
        OFC: "usa",
        CC: "US"
      }, {
        OFC: "venezuela",
        CC: "VE"
      }, {
        OFC: "vietnam",
        CC: "VN"
      }
    ];

    try {
        this.setState({
          status: 'Loading all items...',
          items: []
        });

      //this.props.spHttpClient.get(`${this.props.siteUrl}/_api/web/Lists/GetByTitle('Site Pages')/items`,
      //this.props.spHttpClient.post(`${this.props.siteUrl}/_api/web/Lists/GetByTitle('Site Pages')/GetItems(query=@v1)?@v1={"ViewXml":"<Where><Eq><FieldRef Name="ShowAtHome" /><Value Type="Choice">Yes</Value></Eq></Where><OrderBy><FieldRef Name="Modified" /></OrderBy><GroupBy Collapse="FALSE" GroupLimit="30"><FieldRef Name="Author" /></GroupBy>"}`,
      //(PGLocation eq 'Global' or PGLocation eq '--USA') and  
      let countryCode = "";
        try {
          if (this.state.CountryName) {
            countryCode = getCountryCode(this.state.CountryName.toLowerCase())[0]['CC'];
          }
        } catch (ex) { }

      let filterExpression = this.state.DailyNewsUrl;
      this.props.spHttpClient.get(filterExpression,
        SPHttpClient.configurations.v1,
        {
          headers: {
            'Accept': 'application/json;odata=nometadata',
            'odata-version': ''
          },
        })
        .then((response: SPHttpClientResponse): Promise<{ value: IListItem[] }> => {
          return response.json();
        })
        .then((response: { value: IListItem[] }): void => {
          if (!response['odata.error']) {

            let pgNewsItems = response.value;
            if (pgNewsItems != undefined) {
              if (countryCode.length > 0 && pgNewsItems.length > 0) {
                pgNewsItems = pgNewsItems.filter(v => v.PGLocation.toLowerCase() === "global" || v.PGLocation.toLowerCase() === countryCode.toLowerCase());
              }

              this.setState({
                status: `Successfully loaded ${response.value.length} items`,
                items: pgNewsItems
              });
              this.setLocalStorage("News", JSON.stringify(this.state.items), this.state.chacheExpiryTimeForNews);
            } else {
              $('.react-multi-carousel-track').html('News content is not available. Please contact support help desk.').removeClass("react-multi-carousel-track");
              //console.log('%c%s', 'color: red;', response['odata.error'].message.lang.value);
              this.errorLogging.logError(this.errTitle, this.errModule, "", "Item not found for the given url-" + this.state.DailyNewsUrl, "getPGNews");
            }

          } else {
            $('.react-multi-carousel-track').html('News content is not available. Please contact support help desk.').removeClass("react-multi-carousel-track");
            //console.log('%c%s', 'color: red;', response['odata.error'].message.lang.value);
            this.errorLogging.logError(this.errTitle, this.errModule, "PG Daily News", response['odata.error'].message.value, "getPGNews");
          }
        }, (error: any): void => {

          $('.react-multi-carousel-track').html('News content is not available. Please contact support help desk.').removeClass("react-multi-carousel-track");
          // console.log('%c%s', 'color: red;', "PGNews Error - " + error);
          this.errorLogging.logError(this.errTitle, this.errModule, "PG Daily News", error, "getPGNews");
          this.setState({
            status: 'Loading all items failed with error: ' + error,
            items: []
          });
        });
    } catch (error) {
      $('.react-multi-carousel-track').html('News content is not available. Please contact support help desk.').removeClass("react-multi-carousel-track");
      console.log('%c%s', 'color: red;', "Error: Getting PG News");
      //console.log(error);
      this.errorLogging.logError(this.errTitle, this.errModule, "PG Daily News", error, "getPGNews");
    }


  }

  private getRssFeed(chacheExpiryTimeForStock: number): void {
    console.log("Retrieving PGOne Stock from RSS-" + this.state.StockNewsURL, chacheExpiryTimeForStock);

    var dataSet = {};
    $('#divRss').hide();
    try {
      $.ajax({
        type: "GET",
        url: "https://feed.jquery-plugins.net/load?url=" + encodeURIComponent(this.state.StockNewsURL),
        dataType: "json",
        // async: true,
        success: function (data, abc) {
          if (data.statusCode == 200) {
            $('#divRss').html(data.data[0].description);
            var tables = document.querySelector("#divRss table");
            var rows = tables.getElementsByTagName("tr");
            var price = rows[0].cells[1].innerHTML;
            var changePrice = rows[1].cells[1].innerHTML;
            var changePercent = rows[2].cells[1].innerHTML;
            var volume = rows[3].cells[1].innerHTML;
            var highVal = rows[4].cells[1].innerHTML;
            var lowVal = rows[5].cells[1].innerHTML;
            var intraDay = $("div .link-item a:first");
            var intraDayDetails = data.data[0].title;
            intraDayDetails = intraDayDetails.replace("Intraday Prices: ", "");
            var intraDayItems = intraDayDetails.split("at ")[1];
            var changeColor = "positiveStock";
            if (changePrice.indexOf("(") != -1) {
              changeColor = "negativeStock";
              changePrice = "-" + changePrice;
            } else {
              changePrice = "+" + changePrice;
            }
            $("#stockPrice").html(price);
            $('#stockMovement').addClass(changeColor);
            $('#stockMovement').html(changePrice.replace("(", "").replace(")", ""));
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            var today = new Date(data.data[0].publishDate);
            //$('#stockTimestamp').html(today.toLocaleDateString("en-US", options) + " " + intraDayItems);

            dataSet = {
              'stockPrice': price,
              'stockMovementClass': changeColor,
              'stockMovement': changePrice.replace("(", "").replace(")", ""),
              //'stockTimestamp': today.toLocaleDateString("en-US", options) + " " + intraDayItems
            };


            // this.setLocalStorage("PGOne Stock",JSON.stringify(dataSet),15);
            if (dataSet['stockPrice']) {
              //this.setLocalStorage("Stock", JSON.stringify(dataSet), 15);

              //this.getRssFeed()
              //this.setLocalStorage

            } else {
              $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
            }

            $('#stockContainer').click(function () {
              ga('send', {
                'hitType': 'event', // Required.
                'eventCategory': 'Stock', // Required.
                'eventAction': 'Stock click', // Required.
                'eventLabel': 'Stock click',
                'eventValue': 1
              });
              var win = window.open($('#stockContainer').attr('StockNewsRedirectUrl'), '_blank');
              win.focus();
            });
         

          } else {
            console.log('%c%s', 'color: red;', "Stock News Error - " + data.errorMessage);
            $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
          }


        },
        error: function (textStatus, errorThrown) {
          console.log('%c%s', 'color: red;', "Stock News Error - " + textStatus);
          $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
        }
      });
    }
    catch (ex) {
      console.log('%c%s', 'color: red;', "Stock News Error - ", ex);
      $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
    }




  }

  public setLocalStorage(key, value, ttl) {
    //console.log("setting local storage for " + key);

    var currentTime = new Date();
    var expiryTime = currentTime.setMinutes(currentTime.getMinutes() + ttl);
    const item = {
      value: value,
      expiry: expiryTime,
      currentUser: this.props.pgContext.user.loginName
    };
    localStorage.setItem(this.props.pgContext.web.title.toLocaleUpperCase() + "-" + key, JSON.stringify(item));
  }
  public getLocalStorage(key) {

    const itemStr = localStorage.getItem(this.props.pgContext.web.title.toLocaleUpperCase() + "-" + key);
    // if the item doesn't exist, return null
    if (!itemStr) {
      return null;
    }
    const item = JSON.parse(itemStr);
    var now = new Date();
    var itemExpiry = new Date(item.expiry);
    // compare the expiry time of the item with the current time
    if (this.props.pgContext.user.loginName == item.currentUser && now < itemExpiry) {
      return item.value;
    } else {
      localStorage.removeItem(this.props.pgContext.web.title.toLocaleUpperCase() + "-" + key);
    }

  }

  public hideBreakingNews() {
    // $('.breakingNewsCol').hide();
    this.setState({

      showBreakingNews: false
    });
  }

  public getBreakingNews(): void {
    var dataSet = {};
    //console.log("Retrieving Breaking News from SharePoint")
    try {
      this.setState({
        status: 'Loading all items...',
        breakingNews: []
      });
      var today = (new Date()).toISOString();
      //console.log(today)
      this.props.spHttpClient.get(this.props.siteUrl + "/_api/web/Lists/GetByTitle('BreakingNews')/items?$select=Id,Title,TitleFontColor,Description,BgColor,ContentFontColor,ExpiryDate,ContentScrollSpeed&$filter=(IsActive eq 1 and ExpiryDate ge datetime'" + today + "')&$top=1",
        SPHttpClient.configurations.v1,
        {
          headers: {
            'Accept': 'application/json;odata=nometadata',
            'odata-version': ''
          },
        })
        .then((response: SPHttpClientResponse): Promise<{ value: IBreakingNews[] }> => {
          return response.json();
        })
        .then((response: { value: IBreakingNews[] }): void => {
          try {
            //console.log(response.value);
            if (response.value.length > 0) {

              dataSet = {
                Title: response.value[0].Title,
                Description: response.value[0].Description,
                BgColor: response.value[0].BgColor,
                ContentFontColor: response.value[0].ContentFontColor,
                TitleFontColor: response.value[0].TitleFontColor,
                ExpiryDate: response.value[0].ExpiryDate,
                ContentScrollSpeed: response.value[0].ContentScrollSpeed,
                Animation: "marquee " + response.value[0].ContentScrollSpeed + "s infinite"
              };
              this.setState({
                breakingNews: dataSet,
                showBreakingNews: true
              });
              //this.setMarquee(response.value[0].ContentScrollSpeed);
              this.setLocalStorage("PGBreakingNews", JSON.stringify(dataSet), this.state.chacheExpiryTimeForBreakingNews);
            } else {
              this.setState({
                breakingNews: [],
                showBreakingNews: false
              });
            }
          }
          catch (error) {
            // console.log("Error: Getting PGBreakingNews");
            // console.log(error);
            this.errorLogging.logError(this.errTitle, this.errModule, "", error, "getBreakingNews");
          }

        }, (error: any): void => {
          this.setState({
            status: 'Loading PGBreakingNews failed with error: ' + error,
            breakingNews: [],
            showBreakingNews: false
          });
          this.errorLogging.logError(this.errTitle, this.errModule, "", error, "getBreakingNews");
        });
    } catch (error) {
      //console.log("Error: Getting PGBreakingNews");
      //console.log(ex);
      this.setState({
        status: 'Loading PGBreakingNews failed with error: ' + error,
        breakingNews: [],
        showBreakingNews: false
      });
      this.errorLogging.logError(this.errTitle, this.errModule, "", error, "getBreakingNews");
    }






  }

  public getStockNewsOld(): void {
    try {
      var dataSet = {};
      $('#divRss').hide();

      getJsonRSS("https://feed.jquery-plugins.net/load?url=" + encodeURIComponent(this.state.StockNewsURL),this.state.ConfigMasterMasterItems).then((data) => {
        //console.log(data);
        if (data.statusCode == 200) {
          $('#divRss').html(data.data[0].description);
          var tables = document.querySelector("#divRss table");
          var rows = tables.getElementsByTagName("tr");
          var price = rows[0].cells[1].innerHTML;
          var changePrice = rows[1].cells[1].innerHTML;
          var changePercent = rows[2].cells[1].innerHTML;
          var volume = rows[3].cells[1].innerHTML;
          var highVal = rows[4].cells[1].innerHTML;
          var lowVal = rows[5].cells[1].innerHTML;
          var intraDay = $("div .link-item a:first");
          var intraDayDetails = data.data[0].title;
          intraDayDetails = intraDayDetails.replace("Intraday Prices: ", "");
          var intraDayItems = intraDayDetails.split("at ")[1];
          var changeColor = "positiveStock";
          if (changePrice.indexOf("(") != -1) {
            changeColor = "negativeStock";
            changePrice = "-" + changePrice;
          } else {
            changePrice = "+" + changePrice;
          }
          $("#stockPrice").html(price);
          $('#stockMovement').addClass(changeColor);
          $('#stockMovement').html(changePrice.replace("(", "").replace(")", ""));
          var options = { year: 'numeric', month: 'long', day: 'numeric' };
          var today = new Date(data.data[0].publishDate);
          //$('#stockTimestamp').html(today.toLocaleDateString("en-US", options) + " " + intraDayItems);

          dataSet = {
            'stockPrice': price,
            'stockMovementClass': changeColor,
            'stockMovement': changePrice.replace("(", "").replace(")", ""),
            //'stockTimestamp': today.toLocaleDateString("en-US", options) + " " + intraDayItems
          };


          // this.setLocalStorage("PGOne Stock",JSON.stringify(dataSet),15);
          if (dataSet['stockPrice']) {
            this.setLocalStorage("Stock", JSON.stringify(dataSet), this.state.chacheExpiryTimeForStock);

          } else {
            $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
          }
          // console.log(this.state.StockNewsRedirectUrl);
          $('#stockContainer').click(function () {
            var win = window.open($('#stockContainer').attr('StockNewsRedirectUrl'), '_blank');
            win.focus();
          });
          

        } else {
          console.log('%c%s', 'color: red;', "Stock News Error - " + data.errorMessage);
          $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
        }
      });
    } catch (ex) {
      console.log('%c%s', 'color: red;', "Stock News Error - ", ex);
      $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
    }
  }

  public getStockNews(): void {
    try {
      var dataSet = {};
      $('#divRss').hide();

      getJsonRSS(this.state.StockNewsURL,this.state.ConfigMasterMasterItems).then((data) => {
        //console.log(data);
        if (data.GetStockQuoteListResult.length > 0) {
          var currentPrice = data.GetStockQuoteListResult[0].TradePrice;
          try{
            currentPrice=(Math.round(currentPrice*100)/100).toFixed(2);
          }
          catch{

          }
          $("#stockPrice").html(currentPrice);
          var changePrice = data.GetStockQuoteListResult[0].Change;
          try{
            changePrice=(Math.round(changePrice*100)/100).toFixed(2);
          }
          catch{

          }
          var PreviousClose = data.GetStockQuoteListResult[0].PreviousClose;
          var changeColor = "positiveStock";
          if (currentPrice > PreviousClose) {
            changePrice = "+" + changePrice;
            changeColor = "positiveStock";
          } else if (currentPrice < PreviousClose) {
            changePrice = changePrice;
            changeColor = "negativeStock";
          } else {
            changePrice = changePrice;
            changeColor = "";
          }
          $("#stockMovement").html(changePrice);
          $('#stockMovement').addClass(changeColor);

           //options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' } as const;
          var today = new Date(data.GetStockQuoteListResult[0].TradeDate);
          $('#stockTimestamp').html(today.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }) + " ET");

          dataSet = {
            'stockPrice': currentPrice,
            'stockMovementClass': changeColor,
            'stockMovement': changePrice,
            'stockTimestamp': today.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }) + " ET"
          };


          // this.setLocalStorage("PGOne Stock",JSON.stringify(dataSet),15);
          if (dataSet['stockPrice']) {
            this.setLocalStorage("Stock", JSON.stringify(dataSet), this.state.chacheExpiryTimeForStock);

          } else {
            $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
          }
          //console.log(this.state.StockNewsRedirectUrl);
          $('#stockContainer').click(function () {
            ga('send', {
              'hitType': 'event', // Required.
              'eventCategory': 'Stock', // Required.
              'eventAction': 'Stock click', // Required.
              'eventLabel': 'Stock click',
              'eventValue': 1
            });
            var win = window.open($('#stockContainer').attr('StockNewsRedirectUrl'), '_blank');
            win.focus();
          });
          $("#stockContainer").keyup(function(event) {
            if (event.key === "Enter") {
                $("#stockContainer").click();
            }
        });

        } else {
          //console.log('%c%s', 'color: red;', "Stock News Error - " + data.errorMessage);
          $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
        }
      });
    } catch (error) {
      //console.log('%c%s', 'color: red;', "Stock News Error - ", error);
      $('#stockContainer').html('Something went wrong. Please contact to adminitrator for more details.');
      this.errorLogging.logError(this.errTitle, this.errModule, "", error, "getStockNews");
    }
  }

  public newsItemClick(name, link) {
    ga('send', {
      'hitType': 'event', // Required.
      'eventCategory': 'News', // Required.
      'eventAction': 'News item hit', // Required.
      'eventLabel': name,
      'eventValue': 1,

    });
  }

  public newsScrollClick(nextOrPrevious) {
    ga('send', {
      'hitType': 'event', // Required.
      'eventCategory': 'News', // Required.
      'eventAction': 'Arrow click', // Required.
      'eventLabel': nextOrPrevious,
      'eventValue': 1
    });
  }


}
function getJsonRSS(url,configMaster) {
  //return fetch(url).then((response) => response.json());
  try {
    if(configMaster.CachedStockApi=="no"){
      return fetch(url,{'cache':'no-cache'}).then((response) => response.json());
    }else{
      return fetch(url).then((response) => response.json());
    }
  } catch (error) {
    return fetch(url).then((response) => response.json());
  }
}
function getCountryCode(conuntryName) {
  var found_names = $.grep(countryWithCode, function (v) {
    return v.OFC === conuntryName;
  });
  return found_names;
}

var countryWithCode = [
  {
    OFC: "algeria",
    CC: "DZ"
  }, {
    OFC: "argentina",
    CC: "AR"
  }, {
    OFC: "australia",
    CC: "AU"
  }, {
    OFC: "austria",
    CC: "AT"
  }, {
    OFC: "azerbaijan",
    CC: "AZ"
  }, {
    OFC: "bangladesh",
    CC: "BD"
  }, {
    OFC: "belgium",
    CC: "BE"
  }, {
    OFC: "brazil",
    CC: "BR"
  }, {
    OFC: "bulgaria",
    CC: "BG"
  }, {
    OFC: "canada",
    CC: "CA"
  }, {
    OFC: "chile",
    CC: "CL"
  }, {
    OFC: "china",
    CC: "CN"
  }, {
    OFC: "colombia",
    CC: "CO"
  }, {
    OFC: "costa rica",
    CC: "CR"
  }, {
    OFC: "croatia",
    CC: "HR"
  }, {
    OFC: "czech republic",
    CC: "CZ"
  }, {
    OFC: "denmark",
    CC: "DK"
  }, {
    OFC: "dominican rep.",
    CC: "DO"
  }, {
    OFC: "egypt",
    CC: "EG"
  }, {
    OFC: "finland",
    CC: "FI"
  }, {
    OFC: "france",
    CC: "FR"
  }, {
    OFC: "germany",
    CC: "DE"
  }, {
    OFC: "greece",
    CC: "GR"
  }, {
    OFC: "guatemala",
    CC: "GT"
  }, {
    OFC: "hong kong",
    CC: "HK"
  }, {
    OFC: "hungary",
    CC: "HU"
  }, {
    OFC: "india",
    CC: "IN"
  }, {
    OFC: "indonesia",
    CC: "ID"
  }, {
    OFC: "ireland",
    CC: "IE"
  }, {
    OFC: "israel",
    CC: "IL"
  }, {
    OFC: "italy",
    CC: "IT"
  }, {
    OFC: "japan",
    CC: "JP"
  }, {
    OFC: "kazakhstan",
    CC: "KZ"
  }, {
    OFC: "kenya",
    CC: "KE"
  }, {
    OFC: "latvia",
    CC: "LV"
  }, {
    OFC: "luxembourg",
    CC: "LU"
  }, {
    OFC: "malaysia",
    CC: "MY"
  }, {
    OFC: "mexico",
    CC: "MX"
  }, {
    OFC: "morocco",
    CC: "MA"
  }, {
    OFC: "netherlands",
    CC: "NL"
  }, {
    OFC: "new zealand",
    CC: "NZ"
  }, {
    OFC: "nigeria",
    CC: "NG"
  }, {
    OFC: "norway",
    CC: "NO"
  }, {
    OFC: "pakistan",
    CC: "PK"
  }, {
    OFC: "panama",
    CC: "PA"
  }, {
    OFC: "peru",
    CC: "PE"
  }, {
    OFC: "philippines",
    CC: "PH"
  }, {
    OFC: "poland",
    CC: "PL"
  }, {
    OFC: "portugal",
    CC: "PT"
  }, {
    OFC: "puerto rico",
    CC: "PR"
  }, {
    OFC: "romania",
    CC: "RO"
  }, {
    OFC: "russia",
    CC: "RU"
  }, {
    OFC: "russian fed.",
    CC: "RU"
  }, {
    OFC: "saudi arabia",
    CC: "SA"
  }, {
    OFC: "serbia",
    CC: "RS"
  }, {
    OFC: "singapore",
    CC: "SG"
  }, {
    OFC: "slovakia",
    CC: "SK"
  }, {
    OFC: "south africa",
    CC: "ZA"
  }, {
    OFC: "south korea",
    CC: "KR"
  }, {
    OFC: "spain",
    CC: "ES"
  }, {
    OFC: "sri lanka",
    CC: "LK"
  }, {
    OFC: "sweden",
    CC: "SE"
  }, {
    OFC: "switzerland",
    CC: "CH"
  }, {
    OFC: "taiwan",
    CC: "TW"
  }, {
    OFC: "thailand",
    CC: "TH"
  }, {
    OFC: "turkey",
    CC: "TR"
  }, {
    OFC: "uk",
    CC: "UK"
  }, {
    OFC: "ukraine",
    CC: "UA"
  }, {
    OFC: "united arab emir",
    CC: "AE"
  }, {
    OFC: "united kingdom",
    CC: "UK"
  }, {
    OFC: "usa",
    CC: "US"
  }, {
    OFC: "venezuela",
    CC: "VE"
  }, {
    OFC: "vietnam",
    CC: "VN"
  }
];