import React from 'react';

import Grid from '@material-ui/core/Grid';

// constants (duplicate from simsage-search.js)
const api_base = "http://localhost:8080/api";   // the remote SimSage server's location


const styles = {
    title: {
        fontSize: '16px',
    },
    text: {
        fontSize: '12px',
    },
    previewImage: {
        maxHeight: '100px',
    },
    prevFragment: {
        display: 'inline-block',
        width: '20px',
        background: 'black',
        color: 'white',
        borderRadius: '5px',
        textAlign: 'center',
        marginRight: '5px',
        cursor: 'pointer',
    },
    nextFragment: {
        display: 'inline-block',
        width: '20px',
        background: 'black',
        color: 'white',
        borderRadius: '5px',
        textAlign: 'center',
        cursor: 'pointer',
    },
    prevFragmentDisabled: {
        display: 'inline-block',
        width: '20px',
        background: 'grey',
        color: 'white',
        borderRadius: '5px',
        textAlign: 'center',
        marginRight: '5px',
        cursor: 'default',
    },
    nextFragmentDisabled: {
        display: 'inline-block',
        width: '20px',
        background: 'grey',
        color: 'white',
        borderRadius: '5px',
        textAlign: 'center',
        cursor: 'default',
    },
    author: {
        fontSize: '10px',
        fontWeight: '600',
    },
    url: {
        marginLeft: '10px',
        fontSize: '10px',
        color: 'blue',
        cursor: 'pointer',
    },
    spacer: {
        height: '20px'
    }
};


export class SingleSearchResult extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            has_error: false,
            item: this.props.item,
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            item: nextProps.item,
        });
    }

    componentDidCatch(error, info) {
        this.setState({ has_error: true });
        console.log(error, info);
    }

    // helper - highlight SimSage matching keywords at various levels
    static highlight(str) {
        if (str && str.replace) {
            str = str.replace(/{hl1:}/g, "<span class='hl1'>");
            str = str.replace(/{hl2:}/g, "<span class='hl2'>");
            str = str.replace(/{:hl1}/g, "</span>");
            str = str.replace(/{:hl2}/g, "</span>");
            str = str.replace(/\n/g, "<br />");
        }
        return str;
    }
    prevFragment() {
        const item = this.state.item;
        if (item && item.textIndex > 0) {
            item.textIndex -= 1;
            this.setState({item: item});
        }
    }
    nextFragment() {
        const item = this.state.item;
        if (item && item.textIndex + 1 < item.textList.length) {
            item.textIndex += 1;
            this.setState({item: item});
        }
    }
    getSource(item) {
        return api_base + "/document/preview/" + this.props.organisationId + "/" +
                    this.props.kbId + "/" + this.props.clientId + "/" + item.urlId + "/-1"
    }
    render() {
        if (this.state.has_error) {
            return <h1>single-search-result: Something went wrong.</h1>;
        }
        const item = this.state.item;
        return (
            <Grid container spacing={1} style={styles.gridWidth}>
                <Grid item xs={12}>
                    <div style={styles.title}>{item.title}</div>
                </Grid>
                <Grid item xs={1}>
                    <div>
                        {item.textIndex > 0 &&
                        <span style={styles.prevFragment} onClick={() => this.prevFragment()}>&lt;</span>
                        }
                        {item.textIndex === 0 &&
                        <span style={styles.prevFragmentDisabled}>&lt;</span>
                        }
                        {item.textIndex + 1 < item.textList.length &&
                        <span style={styles.nextFragment} onClick={() => this.nextFragment()}>&gt;</span>
                        }
                        {item.textIndex + 1 >= item.textList.length &&
                        <span style={styles.nextFragmentDisabled}>&gt;</span>
                        }
                    </div>
                </Grid>
                <Grid item xs={9}>
                    <div style={styles.text} dangerouslySetInnerHTML={{__html: SingleSearchResult.highlight(item.textList[item.textIndex])}}/>
                </Grid>
                <Grid item xs={2}>
                    <div style={styles.previewImage}>
                        <img src={this.getSource(item)} alt={item.title} style={styles.previewImage} title={item.title} />
                    </div>
                </Grid>
                <Grid item xs={12}>
                    <span style={styles.author}>{item.author}</span>
                    <span style={styles.url} onClick={() => { if (this.props.openDocument) this.props.openDocument(item.url)} }>{item.url}</span>
                </Grid>
                <Grid item xs={12}>
                    <div style={styles.spacer} />
                </Grid>
            </Grid>
        )
    }

}

export default SingleSearchResult;

