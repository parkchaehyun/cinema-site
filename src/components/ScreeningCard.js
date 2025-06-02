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

  // Format screen_name:
  // 1. Trim any leading/trailing whitespace from the original string.
  // 2. Split the string by the first occurrence of '[' or a space character.
  // 3. Take the first element of the resulting array, which is the part before the delimiter.
  const formattedScreenName = screen_name.trim().split(/\[| /)[0];

  const timeRange = `${start_dt} – ${end_dt}`;
  const seatsLabel = `${remain_seat_cnt} / ${total_seat_cnt}`;

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
        grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_auto_auto]
        ${isClickable
          ? 'cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm'
          : 'opacity-60 cursor-not-allowed'
        }
      `}
      onClick={isClickable ? handleClick : undefined}
    >
      <div className="font-medium text-xs text-gray-700">{formattedScreenName}</div>
      <div className="font-mono text-gray-700 text-base font-bold">{timeRange}</div>
      <div className="text-xs text-gray-600">{seatsLabel}</div>
    </div>
  )
}
