export function getTimeBangla(date) {
  function getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) {
      return 'সকাল';
    } else if (hour >= 12 && hour < 14) {
      return 'দুপুর';
    } else if (hour >= 14 && hour < 17) {
      return 'বিকাল';
    } else if (hour >= 17 && hour < 19) {
      return 'সন্ধ্যা';
    }
    return 'রাত';
  }

  const hour_en = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Dhaka',
  });
  const dayOfTime = getTimeOfDay(hour_en);
  const hour_bn = date
    .toLocaleTimeString('bn-BD', {
      hour: 'numeric',
      hour12: true,
      timeZone: 'Asia/Dhaka',
    })
    .split(' ')[0];
  const min_bn = date
    .toLocaleTimeString('bn-BD', { minute: 'numeric', timeZone: 'Asia/Dhaka' })
    .split(' ')[0];
  return `${dayOfTime} ${hour_bn} টা ${min_bn}`;
}
