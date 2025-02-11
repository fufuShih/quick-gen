import { memo } from 'react';

const MemoButton = memo(({ onClick, label }) => {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
});

export default MemoButton; 
