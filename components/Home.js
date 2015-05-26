var React = require('react');
var Router = require('react-router');
var RouteHandler = Router.RouteHandler;

Home = React.createClass({displayName: "Home",
  componentDidMount: function() {
  },
  componentWillUpdate: function() {
  },
  componentDidUpdate: function() {
  },
  statics: {
  },
  render: function () {
    if (this.props.query) {
      var reason = (Object.keys(this.props.query));

      switch (reason[0]) {
        case "invalid-username":
          var message = React.createElement("p", {className: 'message'}, "That username isn't valid. Try again?");
          break;
        case "invalid-id":
          var message = React.createElement("p", {className: 'message'}, "That channel ID isn't valid. Try again?");
          break;
        default:
          var message = null;
      }
        
    }
    return (
      React.createElement("div", {className: 'wrapper'},
        message,
        React.createElement("form", {action: '/parseFeed', 
          className: 'form-wrapper'}, 
          React.createElement("label", { className: 'channel-submit' }, 
            "Enter a Youtube channel name or ID"),
          React.createElement("input", {type: 'search', 
            className: 'channel-input', 
            name: 'search',
            required: 'true',
            placeholder: 'LastWeekTonight'}), 
          React.createElement("input", {type: 'submit', 
            className: 'channel-submit',
            value: 'Search'
          })
        )
      )
    );
  }
});

module.exports = Home;
