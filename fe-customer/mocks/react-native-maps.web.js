const React = require('react');
const { View, Text } = require('react-native');

function MapView({ style, children }) {
  return React.createElement(View, {
    style: [{ backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }, style],
  },
    React.createElement(Text, { style: { color: '#6b7280', fontSize: 12 } }, 'Map (web preview)'),
    children,
  );
}

function Marker() { return null; }
function Callout() { return null; }
function Circle() { return null; }
function Polyline() { return null; }

MapView.Marker = Marker;
MapView.Callout = Callout;
MapView.Circle = Circle;
MapView.Polyline = Polyline;

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Callout = Callout;
module.exports.Circle = Circle;
module.exports.Polyline = Polyline;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = null;
