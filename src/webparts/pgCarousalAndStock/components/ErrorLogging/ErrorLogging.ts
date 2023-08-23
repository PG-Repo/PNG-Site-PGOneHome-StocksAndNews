import "@pnp/polyfill-ie11";
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { dateAdd, getGUID } from "@pnp/common";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Guid } from "@microsoft/sp-core-library";

export class ErrorLogging {
    private webPartContext: WebPartContext;
    constructor(wpContext: any) {
        this.webPartContext = wpContext;
        sp.setup({
            sp: {
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "ContentType": "application/json; odata=verbose",
                    "User-Agent": "NONISV|PNGOne|PGOneHome/1.0",
                    "X-ClientService-ClientTag": "NONISV|PNGOne|PGOneHome/1.0"
                }
            },
            // set ie 11 mode
            ie11: true,
            spfxContext: wpContext,
        });
    }

    public logError(title?: string, module?: string, subModule?: string, errorText?: string, component?: string) {
        try {
            // adding Error Log to the list
            sp.web.lists.getByTitle("ErrorLog").items.add({
                Title: title,
                Module: module,
                ErrorText: errorText,
                SubModule: subModule,
                Component: component,
                ErrorID: getGUID(),
                ErrorDescription: errorText,
                ErrorTrace: errorText
            });
        }
        catch (error) {
            console.log(error);
        }
    }
}
