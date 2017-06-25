import React from 'react';

export default class ControlButton extends React.Component {
  render() {
    return (
      <button
        style={{
          flex: '1 1 0',
          '-webkit-user-select': 'none',
        }}
        onMouseDown={this.props.onPress}
        onMouseUp={this.props.onRelease}
        onTouchStart={this.props.onPress}
        onTouchEnd={this.props.onRelease}
      >{ this.props.text }
      </button>
    );
  }
}
