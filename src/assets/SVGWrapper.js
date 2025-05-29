import React from 'react';

const SVGWrapper = ({ src, alt, ...props }) => (
  <img src={src} alt={alt || 'SVG Image'} {...props} />
);

export default SVGWrapper;
