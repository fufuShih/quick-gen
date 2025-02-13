import { memo } from 'react';

/**
 * @generated 1700000000000
 * @component MemoButton
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.label - [auto generate]
 * @returns {JSX.Element} React component
 */
const MemoButton = memo(({ onClick, label }) => {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
});

export default MemoButton; 
