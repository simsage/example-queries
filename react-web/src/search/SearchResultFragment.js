import './SearchResultFragment.css';
import {
    get_client_id,
    getKbId,
    highlight,
    unix_time_convert,
    url_to_bread_crumb
} from "../common/Api";
import React from "react";
import {useDispatch} from "react-redux";

export function SearchResultFragment(props) {

    const dispatch = useDispatch();

    const result = props.result;
    const session = props.session;
    const session_id = (session && session.id) ? session.id : "null";
    const client_id = get_client_id();
    const text_list = result.textList ? result.textList : [];
    const similar_document_list = result.similarDocumentList ? result.similarDocumentList : [];
    const related_document_list = result.relatedList ? result.relatedList : [];
    const parent_list = related_document_list.filter(rel => !rel.isChild);
    const child_list = related_document_list.filter(rel => rel.isChild);
    const last_modified = unix_time_convert(result.lastModified);
    const title = result.title ? result.title : "";
    const use_ai = props.use_ai;
    const summary = props.summaries[result.url] ? props.summaries[result.url] : "";
    // Prefer the metadata url to the doc's url as the later might be the source id (Sharepoint)
    const url = result.metadata["{url}"] && result.metadata["{url}"].trim().length > 0 ? result.metadata["{url}"] : result.url
    let url_breadcrumb = url_to_bread_crumb(url);
    if (url_breadcrumb === "owa" && result.metadata["{folder}"] && result.metadata["{folder}"].trim().length > 0) {
        url_breadcrumb = url_to_bread_crumb(result.metadata["{folder}"]);
    }

    // is this a custom render type (like a db record)?
    const custom_render_type = result && result.renderType === "rt custom";
    let custom_render_html = "";
    if (custom_render_type) {
        custom_render_html = highlight(text_list.length > 0 ? text_list[0] : "");
    }

    function item_url(item) {
        return item.webUrl ? item.webUrl : item.relatedUrl;
    }

    const source_set = {};
    if (props.source_list && props.source_list.length > 0) {
        for (const source of props.source_list) {
            source_set[source.sourceId] = source;
        }
    }
    const result_source = source_set[result.sourceId];
    let source_type = "";
    if (result_source && result_source.sourceType) {
        source_type = result_source.sourceType;
    }

    return (
        <div className="d-flex pb-4 mb-3 px-3">
            <div className="ms-3" style={{width: "80%"}}>
                <div className="d-flex align-items-center text-align-end mb-1">
                    <p className="mb-0 result-breadcrumb me-2">{url_breadcrumb}</p>
                </div>
                <span className="mb-2 results-filename text-break pointer-cursor"
                      title={url}>{title ? title : url}
                </span>
                <div className="d-flex align-items-center mb-1">
                    <span className="mb-0 result-details-title">{url}</span>
                </div>
                {/* web sources don't have a valid last modified display */}
                { source_type !== "web" &&
                    <div className="d-flex align-items-center mb-1">
                        <span className="mb-0 result-details">Last modified {last_modified}</span>
                        {result.author &&
                            <span className="d-flex align-items-center">
                                <span className="mb-0 result-details mx-2">|</span>
                                <span className="mb-0 result-details">{result.author}</span>
                            </span>
                        }
                    </div>
                }
                {
                    text_list.map((text, i) => {
                        const _text = highlight(text);
                        return (
                            <div key={i}>
                                <p className="small fw-light mb-2" dangerouslySetInnerHTML={{__html: _text}}/>
                                {parent_list && parent_list.length > 0 &&
                                    <div className="border-top line-width-limited">
                                        <div className="similar-document-title">parent email</div>
                                        <ul>
                                            {
                                                parent_list.map((item, j) => {
                                                    const title = item.title ? item.title : (item.webUrl ? item.webUrl :item.relatedUrl);
                                                    return (<li key={i * 100 + j} className="similar-document-link"
                                                                title={title}>
                                                        {title}
                                                    </li>);
                                                })
                                            }
                                        </ul>
                                    </div>
                                }
                                {child_list && child_list.length > 0 &&
                                    <div className="border-top line-width-limited">
                                        <div className="similar-document-title">attachments</div>
                                        <ul>
                                            {
                                                child_list.map((item, j) => {
                                                    const title = item.title ? item.title : (item.webUrl ? item.webUrl :item.relatedUrl);
                                                    return (<li key={i * 100 + j} className="similar-document-link"
                                                                title={title}>
                                                        {title}
                                                    </li>);
                                                })
                                            }
                                        </ul>
                                    </div>
                                }
                                {
                                    ((child_list && child_list.length > 0) || (parent_list && parent_list.length > 0)) &&
                                    <div className="border-bottom line-width-limited" />
                                }
                                {similar_document_list && similar_document_list.length > 0 &&
                                    <div>
                                        <div className="similar-document-title">similar documents</div>
                                        <ul>
                                            {
                                                similar_document_list.map((similar, j) => {
                                                    return (<li key={i * 100 + j} className="similar-document-link">
                                                        {similar.url}
                                                    </li>);
                                                })
                                            }
                                        </ul>
                                    </div>
                                }
                            </div>
                        );
                    })
                }
                {
                    summary && summary.length > 0 && window.ENV.query_ai_enabled && use_ai &&
                    <div className="border-top">
                        {
                            summary.split("\n").map((text, i) => {
                                return (<div className="pt-2" key={i}>
                                        <span className="py-1" title={text}>{text}</span>
                                    </div>
                                )})
                        }
                    </div>
                }
                <div className="d-flex align-items-center flex-wrap">
                </div>
            </div>
        </div>
    )
}

