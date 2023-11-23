# SimSage Search JavaScript example

## use
Set up the right values for your SimSage instance in `index.html` (See line 14).

```javascript
const data = {
    // Set your ids and constants for SimSage (must come from SimSage)
    // the service layer end-point, change "<server>" to ... (no / at end)
    api_base: "https://test.simsage.ai/api",
    // the organisation id to search
    organisation_id: "c276f883-e0c8-43ae-9119-df8b7df9c574",
    // the knowledge base id
    kb_id: "46ff0c75-7938-492c-ab50-442496f5de51",
    // the credentials for talking to the API / getting a session
    email: "test@simsage.nz",
    password: "",
};
```

open `index.html` in your browser.

the values above are:

| name              | value                                 | description                                                           |
|-------------------|---------------------------------------|-----------------------------------------------------------------------|
| api_base          | http://localhost:8080/api             | remote SimSage SaaS server location, e.g. https://test.simsage.ai/api |
| organisation_id   | c276f883-e0c8-43ae-9119-df8b7df9c574  | SimSage organisation ID to use for searching                          |
| kb_id             | 46ff0c75-7938-492c-ab50-442496f5de51  | SimSage knowledge-base id to use for searching                        |
| email             | test@simsage.nz                       | the user name / email used to sign-into the SimSage API               |
| password          |                                       | the password to sign-into the SimSage API                             |
