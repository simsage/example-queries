
// the settings for this application - no trailing / on the base_url please
// it is imperative that we do not expose the SID here (securityID), as it is what protects your account from malicious use
settings = {
    // the service layer end-point, change "<server>" to ... (no / at end)
    base_url: "https://cloud.simsage.ai",
    // the organisation's id to search - all sanitized
    organisation_id: "c276f883-e0c8-43ae-9119-df8b7df9c574",
    // the knowledge base's Id (selected site) and security id (sid)
    kbId: "",
    // this is the WordPress plugin
    is_wordpress: false,
    // do we have an operator by plan?
    operator_enabled: true,
    // ignore context related items
    context_label: "",
    context_match_boost: 0.01,
    // QA sensitivity - controls the A.I's replies - we suggest you don't change it!
    bot_threshold: 0.8125,
};
