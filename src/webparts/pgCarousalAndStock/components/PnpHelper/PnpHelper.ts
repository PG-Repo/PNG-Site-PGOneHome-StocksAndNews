import "@pnp/polyfill-ie11";
import { dateAdd } from "@pnp/common";
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
//import PnPTelemetry from  "@pnp/telemetry-js"
import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/sp/profiles";
import { ErrorLogging } from "../ErrorLogging/ErrorLogging";
// IE 11 Polyfill import

export class PnPHelper {
    private webPartContext: WebPartContext;
    private siteName: string;
    private currentUserName: string;
    private configValues:any;
    public errorLogging: ErrorLogging;
    constructor(wpContext: any) {
        this.webPartContext = wpContext;
        sp.setup({
            sp: {
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "User-Agent": "NONISV|PNGOne|PGOneHome/1.0",
                    "X-ClientService-ClientTag": "NONISV|PNGOne|PGOneHome/1.0"
                }
            },
            spfxContext: wpContext,
            ie11: true,
            defaultCachingStore: "local",
            enableCacheExpiration: true,
        });
        //const telemetry = PnPTelemetry.getInstance();
        //telemetry.optOut();
        this.currentUserName = this.webPartContext.pageContext.user.loginName;
        this.siteName = this.webPartContext.pageContext.web.title.toLocaleUpperCase();
        this.errorLogging = new ErrorLogging(this.webPartContext);
    }
    public userProps(userProfileProperty: any): Promise<string> {
        return new Promise<string>(async (resolve: (userProfilePropertyValue: any) => void, reject: (error: any) => void): Promise<void> => {
            try {
                this.configValues = await this.getConfigMasterListItems();
                sp.profiles.myProperties
                    .usingCaching({
                        expiration: dateAdd(new Date(), "day", this.configValues["UserProfilePropertyCacheExpiry"]),
                        key: this.siteName + "-UserProfile-" + this.currentUserName,
                        storeName: "local"
                    })
                    .get()
                    .then((result: any): void => {
                        result["UserProfileProperties"]["results"].map((v: any) => {
                            if (v.Key === userProfileProperty) {
                                resolve(v.Value);
                            }
                        });
                    }, (error: any): void => {
                        reject(error);
                    });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    
    public async getResourceListItems(): Promise<any> {

        let resourceItems = new Array();
        return new Promise<any>(async (resolve: (item: any) => void, reject: (error: any) => void): Promise<void> => {
            try {
                this.configValues=await this.getConfigMasterListItems();
                sp.web.lists.getByTitle("ResourcesMaster")
                    .items
                    .select("Title", "ValueForKey")
                    .filter("Locale eq 'en'")
                    .top(5000)
                    .usingCaching({
                        expiration: dateAdd(new Date(), "day", parseInt( this.configValues['ResourceListLabelValuesCacheExpiry'])),
                        key: this.siteName+"-Home-Resources",
                        storeName: "local"
                    })
                    .get()
                    .then(async (items: any): Promise<void> => {
                        try {
                            if (items.length > 0) {
                                items.map((value: any, index: any) => {
                                    resourceItems[value["Title"]] = value["ValueForKey"];
                                });
                                resolve(resourceItems);
                            }
                        }
                        catch (error) {
                            reject(error);
                        }
                    }, (error: any): void => {
                        reject(error);
                    });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    public async getConfigMasterListItems(): Promise<any> {
    //console.log("getConfigMasterListItems");
        let configMasterItems = new Array();
        return new Promise<any>((resolve: (item: any) => void, reject: (error: any) => void): void => {
            try {
                sp.web.lists.getByTitle("ConfigMaster")
                    .items
                    .select("Title", "ConfigValue")
                    //.filter("Locale eq 'en'")
                    .top(5000)
                    .usingCaching({
                        expiration: dateAdd(new Date(), "day", 1),
                        key: this.siteName+"-ConfigMaster",
                        storeName: "local"
                    })
                    .get()
                    .then(async (items: any): Promise<void> => {
                        try {
                            if (items.length > 0) {
                                items.map((value: any, index: any) => {
                                    configMasterItems[value["Title"]] =value["ConfigValue"] ;
                                });
                                resolve(configMasterItems);
                            }
                        }
                        catch (error) {
                            reject(error);
                        }
                    }, (error: any): void => {
                        reject(error);
                    });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public async userProfileDetails(): Promise<any> {
  
        let UserProfile = new Array();
        return new Promise<any>(async (resolve: (item: any) => void, reject: (error: any) => void): Promise<void> => {
            try {
                this.configValues=await this.getConfigMasterListItems();
                sp.profiles.myProperties
                    .usingCaching({
                        expiration: dateAdd(new Date(), "day",parseInt(  this.configValues['UserProfilePropertyCacheExpiry'])),
                        key: this.siteName+"-UserProfile-"+this.webPartContext.pageContext.user.loginName,
                        storeName: "local"
                    })
                    .get()
                    .then(async (items: any): Promise<void> => {
                        try {
                            if (items['UserProfileProperties'].results.length > 0) {
                                items['UserProfileProperties'].results.map((value: any, index: any) => {
                                    UserProfile[value["Key"]] = value["Value"];
                                });
                                resolve(UserProfile);
                            }
                        }
                        catch (error) {
                            reject(error);
                        }
                    }, (error: any): void => {
                        reject(error);
                    });
            }
            catch (error) {
                reject(error);
            }
        });
    }

}