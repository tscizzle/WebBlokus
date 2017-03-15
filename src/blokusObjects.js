import { PropTypes } from 'react';


export const playerShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
});

export const pieceShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  player: PropTypes.number.isRequired,
  shape: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOf(['X','O']))).isRequired,
  used: PropTypes.bool.isRequired,
  numCells: PropTypes.number.isRequired,
});

export const boardShape = PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number));

export const positionShape = PropTypes.shape({
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
});

export const turnShape = PropTypes.shape({
  player: PropTypes.number.isRequired,
  piece: PropTypes.number.isRequired,
  flipped: PropTypes.bool,
  rotations: PropTypes.number,
  position: positionShape.isRequired,
});
