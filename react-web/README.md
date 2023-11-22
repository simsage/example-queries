# SimSage Search UX REACT version

## installing
Make sure you remove any existing `package-lock.json` first
```
export npm_config_loglevel=silent
npm set audit false
npm install
```

## running this UI

```
npm run start
```

## SimSage settings.js

| name                          | value                                                            | description                                                            |
|-------------------------------|------------------------------------------------------------------|------------------------------------------------------------------------|
| version                       | 7.12                                                             | Current version of SimSage displayed on UX                             |
| api_version                   | 1                                                                | API version of SimSage, must be 1                                      |
| app_title                     | SimSage Search                                                   | HTML page title                                                        |
| api_base                      | http://localhost:8080/api                                        | remote SimSage SaaS server location, e.g. https://demo2.simsage.ai/api |
| organisation_id               | c276f883-e0c8-43ae-9119-df8b7df9c574                             | SimSage organisation ID to use for searching                           |
| score_threshold               | 0.8125                                                           | SimSage chat-bot neural network score threshold                        |
| fragment_count                | 10                                                               | no longer user                                                         |
| max_word_distance             | 40                                                               | maximum allowed distance between words for success/failure             |
| page_size                     | 10                                                               | number of search results returned per query                            |
| use_spell_checker             | true                                                             | show spelling suggestions if nothing found and available               |
| email                         | test@simsage.nz                                                  | the user name / email used to sign-into the SimSage API                |
| password                      |                                                                  | the password to sign-into the SimSage API                              |
