import React, { Component } from 'react';
import Autosuggest from 'react-autosuggest';

import styles from './Search.css';

export default class Search extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      suggestions: [],
    };
  }

  getSuggestions = value => {
    const inputValue = value.trim().toLowerCase();
    return inputValue.length === 0 ? [] : (
      this.props.options.filter(o => o.name.toLowerCase().includes(inputValue))
    );
  };

  getSuggestionValue = suggestion => suggestion.name;

  renderSuggestion = suggestion => (
    <div>
      {suggestion.name}
    </div>
  );

  onChange = (event, { newValue }) => {
    if (newValue === '') {
      this.props.onValueCleared();
    }
    this.setState({
      value: newValue,
    });
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: this.getSuggestions(value),
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  selected = (e, { suggestion }) => {
    this.setState({ value: ''})
    this.props.onSuggestionSelected(e, { suggestion });
  }
  render() {
    const inputProps = {
      placeholder: 'Search',
      value: this.state.value,
      onChange: this.onChange,
    };


    return (
      <Autosuggest
        theme={styles}
        suggestions={this.state.suggestions}
        onSuggestionSelected={this.selected}
        onSuggestionHighlighted={this.props.onSuggestionHighlighted}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}
