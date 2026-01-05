import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeSlotSlider from '../src/components/TimeSlotSlider';

vi.mock('react-range', async () => {
  const actual = await vi.importActual<typeof import('react-range')>(
    'react-range',
  );

  type RangeProps = {
    values: number[];
    onChange: (values: number[]) => void;
    onFinalChange: (values: number[]) => void;
    step: number;
    min: number;
    max: number;
    renderTrack: (args: {
      props: Record<string, unknown>;
      children: React.ReactNode;
    }) => React.ReactNode;
    renderThumb: (args: {
      props: { style: React.CSSProperties; key?: React.Key };
    }) => React.ReactNode;
    renderMark: (args: {
      props: { style: React.CSSProperties; key?: React.Key };
    }) => React.ReactNode;
  };

  const MockRange = ({
    values,
    onChange,
    onFinalChange,
    step,
    min,
    max,
    renderTrack,
    renderThumb,
    renderMark,
  }: RangeProps) => (
    <div data-testid='mock-range'>
      <input
        type='range'
        value={values[0]}
        min={min}
        max={max}
        step={step}
        data-testid='mock-thumb-0'
        onChange={e => onChange([Number(e.currentTarget.value), values[1]])}
      />
      <input
        type='range'
        value={values[1]}
        min={min}
        max={max}
        step={step}
        data-testid='mock-thumb-1'
        onChange={e => onChange([values[0], Number(e.currentTarget.value)])}
        onMouseUp={() => onFinalChange(values)}
      />
      {renderTrack({ props: {}, children: <div /> })}
      {renderThumb({ props: { style: {}, key: 'thumb-0' } })}
      {renderThumb({ props: { style: {}, key: 'thumb-1' } })}
      {renderMark({ props: { style: {}, key: 'mark' } })}
    </div>
  );

  return {
    ...actual,
    Range: MockRange,
  };
});

describe('TimeSlotSlider', () => {
  const onTimeRangeChange = vi.fn();

  const baseProps = {
    notAllowedTime: [] as Array<[number, number]>,
    stepMinutes: 60,
    onTimeRangeChange,
  };

  beforeEach(() => {
    onTimeRangeChange.mockClear();
  });

  it('renders default range', () => {
    render(<TimeSlotSlider {...baseProps} />);

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByTestId('mock-range')).toBeInTheDocument();
  });

  it('renders with blocked intervals', () => {
    render(
      <TimeSlotSlider
        {...baseProps}
        notAllowedTime={[
          [9, 10],
          [14, 15],
        ]}
      />,
    );

    expect(screen.getByTestId('mock-range')).toBeInTheDocument();
  });

  it('applies stepMinutes correctly', () => {
    render(<TimeSlotSlider {...baseProps} stepMinutes={30} />);

    expect(screen.getByTestId('mock-thumb-0')).toHaveAttribute('step', '0.5');
    expect(screen.getByTestId('mock-thumb-1')).toHaveAttribute('step', '0.5');
  });

  it('calls onTimeRangeChange on final change', () => {
    render(<TimeSlotSlider {...baseProps} />);

    const thumb0 = screen.getByTestId('mock-thumb-0') as HTMLInputElement;
    const thumb1 = screen.getByTestId('mock-thumb-1') as HTMLInputElement;

    fireEvent.change(thumb0, { target: { value: '2' } });
    fireEvent.change(thumb1, { target: { value: '4' } });
    fireEvent.mouseUp(thumb1);

    expect(onTimeRangeChange).toHaveBeenCalledTimes(1);
  });

  it('renders when blocked time is provided', () => {
    render(<TimeSlotSlider {...baseProps} notAllowedTime={[[10, 12]]} />);

    expect(screen.getByTestId('mock-range')).toBeInTheDocument();
  });
});
