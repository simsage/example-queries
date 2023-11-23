window.ENV = {
    // SimSage platform version (used for display only in UI)
    version: '7.12',
    // api version of api_base
    api_version: 1,
    // the title of the app, displayed everywhere
    app_title: "SimSage Search",
    // the cloud service layer end-point, change "localhost:8080" to ...
    api_base: 'https://test.simsage.ai/api',
    // the details of who we are
    organisation_id: 'c276f883-e0c8-43ae-9119-df8b7df9c574',
    kb_id: '46ff0c75-7938-492c-ab50-442496f5de51',
    // user details for singing in - needed to get a session
    email: 'test@simsage.nz',
    password: '',
    // search parameters
    score_threshold: 0.8125,
    fragment_count: 10,
    max_word_distance: 40,
    page_size: 10,
    // use spelling suggestions
    use_spell_checker: true,
};
