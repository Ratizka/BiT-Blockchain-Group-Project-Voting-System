module.exports = {
  ReactComponent: props => ({
    $$typeof: Symbol.for('react.element'),
    type: 'svg',
    ref: null,
    key: null,
    props: Object.assign({}, props, {
      children: []
    })
  }),
  default: 'svg-mock'
};