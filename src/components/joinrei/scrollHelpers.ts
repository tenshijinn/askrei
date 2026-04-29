export const scrollToLastSection = () => {
  const sections = document.querySelectorAll('.snap-start');
  if (sections.length > 0) {
    sections[sections.length - 1].scrollIntoView({ behavior: 'smooth' });
  }
};
