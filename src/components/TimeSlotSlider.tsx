import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Range } from 'react-range';
import { convertNumericToTime } from '../utils/utils';
import type { Draft } from '../types';
import '../styles/TimeSlotSlider.css';

type TimeSlotSliderProps = {
  notAllowedTime: Array<[number, number]>;
  stepMinutes?: number;
  onTimeRangeChange: React.Dispatch<React.SetStateAction<Draft>>;
  onDraggingChange?: (isDragging: boolean) => void;
};

type ThumbProps = React.HTMLAttributes<HTMLDivElement> & { key?: React.Key };
type MarkProps = React.HTMLAttributes<HTMLDivElement> & { key?: React.Key };

const TimeSlotSlider = memo(function TimeSlotSlider({
  notAllowedTime,
  stepMinutes = 60,
  onTimeRangeChange,
  onDraggingChange,
}: TimeSlotSliderProps) {
  const [selectedRange, setSelectedRange] = useState<[number, number]>([0, 1]);
  const draggingRef = useRef(false);

  // Однократная установка drag
  const setDragging = useCallback(
    (v: boolean) => {
      if (draggingRef.current === v) return;
      draggingRef.current = v;
      onDraggingChange?.(v);
    },
    [onDraggingChange],
  );

  // Перемещение слайдера
  const handleSliderChange = useCallback(
    (values: [number, number]) => {
      if (
        notAllowedTime.some(
          ([start, end]) =>
            (values[0] > start && values[0] < end) ||
            (values[1] > start && values[1] < end),
        )
      )
        return;
      setDragging(true);
      setSelectedRange(prev => {
        if (
          notAllowedTime.some(
            ([start, end]) => values[0] <= start && values[1] >= end,
          )
        ) {
          const movedIndex = prev[0] !== values[0] ? 0 : 1;
          const copy: [number, number] = [...values] as [number, number];
          copy[movedIndex === 0 ? 1 : 0] = copy[movedIndex];
          values = copy;
        }

        return values;
      });
    },
    [setDragging, notAllowedTime],
  );

  // Конечный коммит осле отпускания слайдера
  const commitToDraft = useCallback(
    (values: [number, number]) => {
      setDragging(false);
      onTimeRangeChange(d => ({
        ...d,
        time: `${convertNumericToTime(values[0])}-${convertNumericToTime(
          values[1],
        )}`,
        hours: values[1] - values[0],
      }));
    },
    [onTimeRangeChange, setDragging],
  );

  // Форматирование таймслотов для слайдера
  const blockedIntervals = useMemo(() => {
    return notAllowedTime.map(([start, end]) => ({
      start: (start * 100) / 24,
      end: (end * 100) / 24,
    }));
  }, [notAllowedTime]);

  return (
    <div className='time-slot-slider'>
      <div className='slider-labels'>
        <span>{convertNumericToTime(selectedRange[0])}</span>
        <span>{convertNumericToTime(selectedRange[1])}</span>
      </div>

      <Range
        values={selectedRange}
        step={stepMinutes / 60}
        min={0}
        max={24}
        onChange={handleSliderChange as (values: number[]) => void}
        onFinalChange={commitToDraft as (values: number[]) => void}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '6px',
              backgroundColor: '#A8E4A0',
              position: 'relative',
            }}
          >
            {blockedIntervals.map((interval, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${interval.start}%`,
                  right: `${100 - interval.end}%`,
                  top: '0',
                  bottom: '0',
                  backgroundColor: '#f44336',
                }}
              />
            ))}
            {children}
          </div>
        )}
        renderThumb={({ props }) => {
          const { key, ...rest } = props as ThumbProps;
          return (
            <div
              key={key}
              {...rest}
              style={{
                ...props.style,
                height: '20px',
                width: '20px',
                borderRadius: '50%',
                backgroundColor: '#1976d2',
              }}
            />
          );
        }}
        renderMark={({ props }) => {
          const { key, ...rest } = props as MarkProps;
          return (
            <div
              key={key}
              {...rest}
              style={{
                ...props.style,
                backgroundColor: '#1976d2',
              }}
            />
          );
        }}
      />
    </div>
  );
});

export default TimeSlotSlider;
