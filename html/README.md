# Custom integration with SimSage SiteSearch

SimSage SiteSearch enables websites to use SimSage’s search functionality, including automatic operator-handover.
Use the following steps to integrate SimSage with your own site.  We have created a simple-to-follow template for here.
Follow these steps to set up SimSage SiteSearch: 

- Contact SimSage to set up your organisation and get your SimSage ID.
- Put the SimSage search box in the header of every page on your site using the HTML example above.
- Add a new SimSage search result page to your site, and use the HTML, Javascript, CSS as shown in the HTML sample above to enable that functionality.


# SimSage full HTML search example

This example is a fully integrated search box in the header of a page.  
The example displays search-results on a new page called `search-results.html`.

Here is a list of the files in this template and their use.

| file | description | usage |
| --- | --- | --- |
| favicon.png | the SimSage favourite icon for our example web-site | ignore |
| index.html | An example html page as a template for any of your pages in your own web-site.  Follow the comments to copy the right parts of this file | follow the comments inside the file |
| README.md | this file | ignore |
| search-results.html | The SimSage result rendering.  A large page displaying the SimSage search results on a single page. | follow the comments inside the file |
| simsage-settings.js | The SimSage connection settings.  Modify this file and make sure set the `base_url` and `organisation_id` to sensible values before use. | copy |
| css/helper-styles.css | A css style-sheet for making this demonstration a little more presentable. | ignore |
| css/simsage-search-box.css | A css style-sheet to be included on any page the SimSage search control box is to be placed. | copy and customize as you see fit |
| css/simsage-search-results.css | A css style-sheet for rendering results, error messages, bot messages, detailed views, operator chat and other features | copy |
| js/jquery-3.6.0.min.js | the jQuery library.  Any version after 1.0.0 will do, required by SimSage for functionality | copy or use your own version |
| js/socks.js | the Javascript socks library (sockjs-client v1.0.3, http://sockjs.org).  Only needed if you enable the operator (enabled by default) in `simsage-settings.js` | copy if you need operator functionality |
| js/stomp.js | the Javascript stomp library (Stomp Over WebSocket http://www.jmesnil.net/stomp-websocket/doc/).  Only needed if you enable the operator in `simsage-settings.js` | copy if you need operator functionality |
| js/simsage-search.js | the SimSage search functionality library.  Only needed on the `search-results.html` page | copy |

# SimSage settings

It is vitally important that you change the `simsage-settings.js` file before running this demo.
You need to contact SimSage and get the appropriate values for your site.  The default settings below only work for the SimSage companies own SiteSearch.

| setting | description | example value |
| --- | --- | --- |
| base_url | the URL of the SimSage server you're communicating with. | https://cloud.simsage.ai |
| organisation_id | your organisation's ID.  You can get one of these from SimSage. The default value is SimSage's own ID for testing. | c276f883-e0c8-43ae-9119-df8b7df9c574 |
| operator_enabled | Operator functionality enabled / disabled flag.  Set this to `true` if you want to use SimSage's automatic operator handover functionality to connect to a human operator.  This requires the inclusion of the `js/stomp.js` and `js/socks.js` files as described above if set to `true` | true |
