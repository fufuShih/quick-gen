import { memo } from 'react';

const MemoComponent = memo(({ text }) => {
  return <div>{text}</div>;
});

export default MemoComponent; 