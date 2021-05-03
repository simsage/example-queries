import React, {Component} from 'react';
import SimsageSearch from "./simsage-search";


export class SearchPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    componentDidCatch(error, info) {
        this.props.setError(error, info);
        console.log(error, info);
    }
    componentDidMount() {
    }
    render() {
        {/* clientId below is a random GUID that uniquely identifies a single client for keeping state inside SimSage */}
        return (
             <div>
                 <SimsageSearch
                     organisationId="c276f883-e0c8-43ae-9119-df8b7df9c574"
                     kbId="46ff0c75-7938-492c-ab50-442496f5de51"
                     clientId="37542428-7bf3-45a0-beb4-5179e6931379"
                     onError={ (title, message) => alert(title + ':' + message) }
                 />
             </div>
        )
    }
}

export default SearchPage;
