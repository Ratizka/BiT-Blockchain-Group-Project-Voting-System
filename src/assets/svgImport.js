import React from 'react';
import SVGWrapper from './SVGWrapper';
import BITLogoSrc from './bitlogo.svg';

const BITLogo = props => (
  <SVGWrapper src={BITLogoSrc} alt="BIT Logo" {...props} />
);

export { BITLogo };
