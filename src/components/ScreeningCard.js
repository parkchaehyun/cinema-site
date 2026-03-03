import React from 'react'

export default function ScreeningCard({ screening }) {
  const {
    screen_name,
    start_dt,
    end_dt,
    remain_seat_cnt,
    total_seat_cnt,
    url,
  } = screening

  const formattedScreenName = screen_name.trim().split(/\[| /)[0];

  const timeRange = `${start_dt} – ${end_dt}`;

  const pct = total_seat_cnt > 0 ? remain_seat_cnt / total_seat_cnt : 0;
  const badgeColor = pct >= 0.5
    ? 'bg-green-100 text-green-700'
    : pct >= 0.2
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';

  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  };

  const isClickable = !!url;

  return (
    <div
      className={`
        border border-gray-300 rounded-lg p-2.5 mb-2 grid items-center gap-4
        ${total_seat_cnt > 0 ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]'}
        ${isClickable
          ? 'cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm'
          : 'opacity-60 cursor-not-allowed'
        }
      `}
      onClick={isClickable ? handleClick : undefined}
    >
      <div className="font-medium text-xs text-gray-700">{formattedScreenName}</div>
      <div className="font-mono text-gray-700 text-base font-bold">{timeRange}</div>
      {total_seat_cnt > 0 && (
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badgeColor}`}>
          {remain_seat_cnt}/{total_seat_cnt}
        </span>
      )}
    </div>
  )
}
