import React, { Component } from 'react';

import styles from './Search.css';

import Autosuggest from 'react-autosuggest';

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
    return inputValue.length === 0 ? [] : this.props.options.filter(o => {
      return o.name.toLowerCase().includes(inputValue);
    });
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
        onSuggestionSelected={this.props.onSuggestionSelected}
        onSuggestionHighlighted={this.props.onSuggestionHighlighted}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
};