
export function getDayNameBangla(englishDayName) {
  // enum for days
  const days = {
    sunday: "রবিবার",
    monday: "সোমবার",
    tuesday: "মঙ্গলবার",
    wednesday: "বুধবার",
    thursday: "বৃহস্পতিবার",
    friday: "শুক্রবার",
    saturday: "শনিবার"
  }
  // return bangla day name
  return days[englishDayName.toLowerCase()];
}