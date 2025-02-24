import { memo } from 'react';

/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  label: AutoGen,
 * }} MemoButtonProps
 */

/** @type {(props: MemoButtonProps) => JSX.Element} */
const MemoButton = memo(({ onClick, label }) => {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
});

export default MemoButton; 
