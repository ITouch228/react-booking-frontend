import { memo } from 'react';
import { RingLoader } from 'react-spinners';

type SpinnerProps = {
  mul?: (string | number) | undefined;
  top?: (string | number) | undefined;
};

const Spinner = memo(function Spinner({ mul = '100px' }: SpinnerProps) {
  return (
    <div>
      <RingLoader
        color='gray'
        speedMultiplier={2}
        size={mul}
        cssOverride={{ margin: '0 auto' }}
      />
    </div>
  );
});

export default Spinner;
